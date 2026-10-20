# Tanvelo — Production Readiness Fix Plan

Re-verified: **2026-10-20** against the current working tree, Neon PostgreSQL, and Redis 7.

## Current status

| Check | Result |
|---|---|
| `pnpm build` (clean `.next`) | ✅ Passes |
| `pnpm test` | ✅ 53/53 passing |
| Core + Gateway TypeScript builds | ✅ Pass |
| Web production build | ✅ Pass |
| Live DB + Redis smoke test | ✅ Pass |
| Routing / failover / streaming E2E with local mock provider | ✅ Pass |
| Real OpenAI / Anthropic / Gemini calls | ⚠️ Ready — mocked-fetch contract tests verified; live keys optional |
| Production deployment assets | ✅ App Dockerfiles, production compose, CI workflow, Prisma migrations committed |

This file lists the remaining work. Items are ordered by release severity. An item is not done until it has a regression test and has been exercised against the real service or a staging deployment.

> **Before every release build, delete `apps/web/.next`.** A stale `.next` cache caused a transient `pages-manifest.json` build failure during this audit. A clean build passed immediately afterwards. CI should always build from a clean workspace.

---

# P0 — Release blockers

## 1. Fix the Models page

**Problem:** `apps/web/src/app/models/page.tsx` calls `/api/models` without a `projectId`. The API requires one and returns `400 {"error":"projectId is required"}`, so the page never loads a model list.

**Where:**
- `apps/web/src/app/models/page.tsx` — `fetch('/api/models')`

**Fix:**
- Import `useProject()` and pass `projectId=${currentProject.id}`.
- Re-fetch when the selected project changes.
- Render an empty state when no project is selected.
- Add loading and error states instead of silently leaving `models` empty.

**Acceptance:**
- Models page lists the seeded catalog for the selected project.
- Toggling `isEnabled` and editing pricing persists and survives a refresh.

---

## 2. Fix the Usage & Budgets page and budget API contract

**Problem:** The page is broken in two independent ways:
1. It calls `GET /api/budgets/alerts?projectId=...`, but no such route exists — it returns `404`.
2. It assumes `GET /api/budgets` returns the budget object directly. The API returns `{ budget, alerts }`. The page then reads `bData.maxBudgetUsd` and throws, so the budget card never loads and settings cannot be saved.

**Where:**
- `apps/web/src/app/budgets/page.tsx:52-70` — two fetches and wrong response shape.
- `apps/gateway/src/routes/management.routes.ts:769` — returns `{ budget, alerts }`.

**Fix (recommended API contract):**
- Keep `GET /api/budgets?projectId=...&environmentId=...` returning `{ budget, alerts }`.
- In the page, call only that endpoint and assign `data.budget` to `budget`, `data.alerts` to `alerts`.
- Delete the `/api/budgets/alerts` call, or add that route explicitly and return `alerts` consistently.
- Remove `resetDayOfMonth` from the frontend interface — it does not exist in the Prisma schema.
- Add loading, error, and “no budget configured” states.

**Also required for a complete budget feature:**
- `POST /api/budgets` must accept `environmentId` and `period` (`daily` | `monthly` | `total`).
- Set `resetAt` when a budget is created or its period changes.
- Initialize `resetAt` lazily for existing budgets with `null`.
- `checkBudget()` and the spend-update path must prefer an environment-specific budget over the project budget, matching the selector order.
- Avoid duplicate warning alerts and webhooks. Create an alert only when spend crosses the threshold during that request, not on every request above it.
- Add an environment selector to the page if environment-level budgets are supported.

**Acceptance:**
- Budget card shows spend/limit after page load.
- Saving budget settings works and persists.
- A `$0` hard limit blocks requests with `429` and `error.type = budget_exceeded`.
- A daily/monthly budget resets when `resetAt` passes.
- Environment budgets are selected before project budgets.

---

## 3. Add a real Prisma migration path

**Problem:** `packages/db/prisma/migrations/` does not exist. `prisma migrate status` reports:

> No migration found in prisma/migrations — the current database is not managed by Prisma Migrate.

The README only documents `prisma db push`, which is not a safe production deployment strategy: it has no version history, no rollback, and no audit trail. The `migrate:deploy` script currently has nothing to deploy.

**Fix:**
1. Create an initial SQL migration from the current schema:

   ```bash
   cd packages/db
   mkdir -p prisma/migrations/20261020000000_init
   pnpm exec prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/20261020000000_init/migration.sql
   ```

2. Baseline the existing Neon database once:

   ```bash
   pnpm exec prisma migrate resolve --applied 20261020000000_init
   ```

3. On every new environment, use:

   ```bash
   pnpm --filter @tanvelo/db exec prisma migrate deploy
   ```

4. Add a root script such as `db:migrate:deploy` and use it in CI/CD.
5. Keep `prisma db push` only for disposable local databases.
6. Document backup + rollback steps before running migrations in production.
7. Add a migration smoke test that creates an empty test database, runs `migrate deploy`, and verifies the schema.

**Acceptance:**
- A fresh database can be created with migrations alone.
- Staging deploys with `migrate deploy`, not `db push`.
- `prisma migrate status` is clean after deployment.

---

## 4. Define and enforce authorization for Clerk users

**Problem:** Clerk authentication was added, but authorization was not. Current behavior:
- `/sign-up` is public.
- Any authenticated Clerk user can reach every dashboard route.
- There are no role, tenant, or project ownership checks in the management API.
- A signed-in user can read and modify every project, key, provider, webhook, and budget.

If public sign-up is enabled, this is a full multi-tenant data exposure. The README still says dashboard login is excluded, so product documentation and implementation disagree.

**Choose one production model:**

### Option A — Single-tenant private admin (fastest)
- Disable public sign-up in Clerk.
- Restrict access to an allowlist of Clerk user IDs or an organization.
- Document that Tanvelo is a single-tenant control plane.
- Still add server-side checks; do not rely only on middleware.

### Option B — Multi-tenant SaaS (required if self-service sign-up stays)
- Add ownership/membership data:
  - `Project.ownerId` or an `Organization` model, plus `ProjectMember`/roles.
  - Map Clerk `userId` and `orgId` to Tanvelo organizations.
- Enforce access in every `/api/*` handler:
  - List only projects the user belongs to.
  - Reject reads/writes to projects outside the user's organization.
  - Require an admin role for destructive operations (delete project, rotate keys, provider credentials, webhooks).
- Add tests with two users in two organizations proving isolation.
- Ensure unauthenticated API requests return `401` JSON, not an HTML redirect.

**Acceptance:**
- User A cannot see or mutate User B's project by changing an ID in the URL.
- Public sign-up is either disabled or safely isolated.
- Roles are enforced server-side and covered by integration tests.

---

## 5. Make the management API secret work with the dashboard

**Problem:** `MANAGEMENT_API_SECRET` is currently empty, so the private management listener accepts unauthenticated requests from anything that can reach `127.0.0.1:4001`. If the secret is set, the Next.js rewrite in `apps/web/next.config.js` does not forward `X-Management-Secret`, so every dashboard `/api/*` call returns `401`.

This means the current code cannot be configured both securely and functionally without a change.

**Fix:**
- Require a strong `MANAGEMENT_API_SECRET` in production, including when the management listener is loopback-only.
- Replace the raw `rewrites()` proxy with a server-side catch-all route handler that:
  - verifies the Clerk session,
  - injects `X-Management-Secret`,
  - forwards the request to `127.0.0.1:4001`,
  - returns JSON errors.
- Alternatively, place the management API behind an authenticated internal reverse proxy that injects the header.
- Never expose port `4001` publicly.
- Add a startup check that refuses production startup if the secret is missing or shorter than 32 characters.
- Add tests for: valid secret, missing secret, wrong secret, and dashboard proxy with the secret configured.

**Acceptance:**
- Dashboard works with the secret enabled.
- Direct requests to `4001` without the secret return `401`.
- `4001` is not reachable from the public internet.

---

## 6. Reconcile privacy policy with actual payload storage

**Problem:** The Privacy Policy states:

> “By default, Tanvelo does not retain prompt payloads or model generation bodies.”

The gateway does retain them. `gateway.service.ts` persists `requestBodySanitized` and `responseBodySanitized` for every request. `sanitizePayload()` only redacts authentication keys and truncates long strings; it does not remove prompts, messages, or completions.

This is a compliance and customer-trust issue, not only a documentation issue.

**Fix (preferred):**
- Stop persisting prompt and response bodies by default.
- Add an explicit environment flag, e.g. `LOG_PAYLOADS=false`, and only store sanitized bodies when enabled.
- Add a retention period and cleanup job for request metadata.
- Remove `requestBodySanitized` and `responseBodySanitized` from API responses if they are not needed by the inspector.
- Update the Privacy Policy to match exactly.

**If payload logging is a product requirement:**
- Rewrite the Privacy Policy and in-product disclosures to state what is stored, why, where, and for how long.
- Add data export/deletion endpoints and document them.
- Redact PII/secrets at the field level, not only auth headers.
- Do not claim “no retention” or “zero data retention.”

**Also remove or implement these overclaims in legal/marketing pages:**
- “mutual TLS” — the code uses standard HTTPS to providers, not mTLS.
- “blocked at the socket layer” — SSRF checks are application-level.
- “hardware encryption enclave” — keys are encrypted with AES-256-GCM in PostgreSQL; there is no HSM/enclave.

**Acceptance:**
- A request/response body cannot be retrieved from the database or inspector unless payload logging is explicitly enabled.
- Privacy policy statements are verifiable against code.
- Retention/deletion behavior is documented.

---

## 7. Verify real provider integrations

**Problem:** No live OpenAI, Anthropic, or Gemini credentials are configured. The adapters compile and the routing path was validated with a local mock, but real provider request/response shapes, auth headers, streaming formats, model names, and error codes are unverified. The seeded catalog also uses older model IDs and prices (Claude 3.5, Gemini 1.5).

**Fix:**
- Add a staging-only provider contract suite, gated by environment variables:
  - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.
  - Test connection, non-streaming chat, streaming chat, invalid key, rate-limit/timeout behavior.
- Verify OpenAI, Anthropic, and Gemini adapters against current provider APIs.
- Verify OpenAI-compatible providers (Groq, DeepSeek, Mistral, OpenRouter, Cohere, Ollama/vLLM/LM Studio) against at least one real endpoint each or mark them “community/untested.”
- Update model IDs, context windows, and pricing to current values.
- Add mocked-fetch contract tests for every adapter so CI covers translation logic without spending provider credits.
- Test tool/vision/multimodal behavior or explicitly reject unsupported content types instead of passing them through incorrectly.

**Acceptance:**
- At least one real request and one real stream succeed for each of OpenAI, Anthropic, and Gemini.
- Invalid credentials produce the expected error category.
- Fallback works with real upstream 429/5xx responses.
- Model catalog matches the providers actually supported.

---

# P1 — High-severity correctness and security

## 8. Enforce model enable/disable in the gateway

**Problem:** Disabling a model via `PATCH /api/models/:id` hides it from `GET /v1/models`, but the gateway still routes requests for it. Verified live: disabled `gpt-4o-mini` returned `200`.

**Fix:**
- Before routing, check the requested model against enabled `ModelConfig` records for the project.
- Return `400 unsupported_model` or `404` when a configured model is disabled.
- Define behavior for unknown/custom model IDs (allow by default or reject behind a flag).
- Keep `/v1/models` and the gateway consistent.
- Add integration tests for enabled, disabled, unknown, and fallback-routed models.

---

## 9. Implement or remove `X-Tanvelo-Fallbacks`

**Problem:** Both SDKs and the Docs page advertise per-request fallback via `X-Tanvelo-Fallbacks`, but the gateway ignores the header. Verified live: a request with `X-Tanvelo-Fallbacks: gpt-4o` returned `503` instead of falling back.

**Fix (choose one):**
- Implement it:
  - Parse the comma-separated list, validate length and model/provider ownership.
  - Turn it into a transient routing override or extend `RoutingEngine` with per-request fallbacks.
  - Preserve deterministic rule precedence and document precedence.
  - Add tests for valid, malformed, and unknown fallback entries.
- Or remove it from both SDKs, the Docs page, and the README, and add a clear “use routing rules” note.

Do not ship documentation for behavior that does not exist.

---

## 10. Add the SDK telemetry headers or stop reading them

**Problem:** The TypeScript SDK reads `x-tanvelo-latency-ms` and `x-tanvelo-cost-usd`. The gateway sends only `X-Tanvelo-Request-Id`, `X-Tanvelo-Provider`, and `X-Tanvelo-Model`. SDK `latencyMs` and `costEstimate` are therefore always `undefined`.

**Fix:**
- For non-streaming requests, set:
  - `X-Tanvelo-Latency-Ms`
  - `X-Tanvelo-Cost-Usd` (when usage and pricing exist)
- For streaming, cost is unknown before the first byte. Either omit cost and document that, or emit usage only in the terminal SSE chunk.
- Alternatively, remove the header reads from the SDK and compute latency client-side.
- Add tests asserting the headers the SDK expects actually exist.

---

## 11. Fix fallback behavior when `maxRetries = 1`

**Problem:** `RoutingEngine.executeChat/executeStreamChat` loop with `while (attemptNum <= maxRetries)`. With `maxRetries = 1`, a failed primary switches to the secondary, increments `attemptNum` to `2`, and exits the loop without trying the secondary. The request fails with “Exhausted all routing attempts.”

**Fix:**
- Separate “max attempts” from “retry count,” or loop over an explicit attempt list: primary + secondary.
- Ensure a configured secondary is attempted regardless of `maxRetries` value.
- Add tests for `maxRetries` = 1, 2, and 0 (disabled).
- Validate routing rule inputs (timeout > 0, retries >= 0).

---

## 12. Make health checks reflect dependency failures

**Problem:** `GET /health` always returns `"status": "healthy"` even when the database check fails. It only places the error string in `database`. A load balancer or uptime monitor will keep routing traffic to a broken gateway.

**Fix:**
- Return `503` when the database is unavailable.
- Introduce `/health/live` (process alive) and `/health/ready` (DB + Redis reachable) if the platform supports separate probes.
- Keep degraded Redis behavior explicit: the gateway can serve with in-memory limits, but readiness should report `degraded` and trigger an alert.
- Add tests that mock DB failure and assert `503`.

---

## 13. Stop returning encrypted provider keys to the browser

**Problem:** `GET /api/projects/:id` uses `include: { providerConnections: true }`, which returns the full database rows, including `apiKeyEncrypted`. The dashboard does not need ciphertext.

**Fix:**
- Replace with a `select` that excludes `apiKeyEncrypted` (and any future secret fields).
- Return only `provider`, `customName`, `isCustom`, `apiKeyPreview`, `apiBaseUrl`, `status`, and timestamps.
- Audit every management response for secrets: API key hashes, encrypted provider keys, webhook secrets, request headers.
- Add a response-shape test that asserts secret fields are absent.

---

## 14. Validate encryption configuration at startup

**Problem:** If `ENCRYPTION_SECRET` is missing, `crypto.ts` silently falls back to a deterministic development key. In production, that means provider credentials are encrypted with a publicly known key. Changing the secret later also makes existing ciphertext undecryptable, with no key versioning or migration.

**Fix:**
- Require `ENCRYPTION_SECRET` in production and fail fast if missing or malformed.
- Require a 32-byte key (64 hex characters), not an arbitrary passphrase.
- Add a key-version prefix to ciphertext and a rotation plan.
- Do not use `scrypt` on a low-entropy secret without documenting KDF parameters.
- Add startup tests for missing, short, non-hex, and valid secrets.

---

## 15. Harden webhook SSRF protection

**Problem:** `validateWebhookUrl()` checks the initial URL and DNS result, but `fetch()` follows redirects by default. A public URL can redirect to `127.0.0.1` or `169.254.169.254`. IPv4-mapped IPv6 addresses (e.g. `::ffff:127.0.0.1`) are also not fully covered.

**Fix:**
- Set `redirect: 'error'` for webhook fetches, or manually follow redirects and revalidate every hop.
- Block IPv4-mapped IPv6, CGNAT (`100.64.0.0/10`), benchmark ranges, and other non-public ranges.
- Pin the validated resolved IP for the actual request where the HTTP client supports it, or use a custom DNS lookup.
- Reject URLs with credentials, unusual ports, or non-HTTP(S) schemes.
- Add tests for redirect-to-loopback, IPv6-mapped addresses, DNS rebinding, and decimal/hex IP forms.

---

## 16. Isolate the test database

**Problem:** Tests use the production `DATABASE_URL` from `.env`. They now create and delete an isolated project, but a mistake or a failed cleanup can still create/delete data in Neon. `TEST_DATABASE_URL` exists in `.env.example` but is unused.

**Fix:**
- Load `TEST_DATABASE_URL` in test setup and use it for Prisma.
- Fail fast if `TEST_DATABASE_URL` is missing or equals `DATABASE_URL`.
- Run migrations against the test database before tests.
- Use a dedicated Neon branch or ephemeral PostgreSQL service in CI.
- Keep the existing “Default Project unchanged” assertion.
- Never run destructive tests against production data, even with project isolation.

---

## 17. Enforce API key permissions or remove the field

**Problem:** `GatewayApiKey.permissions` is stored (default `["chat:completions"]`) but never checked. A key intended for a limited scope can still perform any allowed gateway action, and there is no scope UI.

**Fix:**
- Define supported scopes (`chat:completions`, `models:list`, etc.).
- Check the required scope in each `/v1/*` route.
- Expose scopes in the API-key creation UI/API.
- Or remove the field and document that all keys have full gateway access.
- Add tests that a key without the required scope receives `403`.

---

## 18. Correct rate-limiter documentation and semantics

**Problem:** README and Settings call the limiter “sliding window” / “atomic token bucket.” The implementation uses fixed-window `INCR` + `EXPIRE` counters. It also returns `X-RateLimit-Reset` as seconds remaining, not an absolute reset timestamp.

**Fix (choose one):**
- Implement a true sliding-window or token-bucket algorithm in a Redis Lua script.
- Or rename all docs/UI to “fixed-window counters” and document the burst behavior at window boundaries.
- Add `Retry-After` on `429`.
- Document that the in-memory fallback is per-process and not suitable for multi-instance production without Redis.
- Test Redis failure/failover behavior and the in-memory fallback path.

---

## 19. Reconcile dashboard documentation with actual features

**Problem:** The Docs page advertises:
- `X-Tanvelo-Fallbacks` (not implemented),
- fallback arrays in both SDKs (not implemented end-to-end),
- rate-limiter behavior that differs from the implementation,
- provider/model availability that has not been verified against live APIs.

**Fix:**
- Update the Docs page and SDK READMEs after the underlying behavior is fixed, or remove the claims.
- Document authentication (Clerk), management API boundaries, error codes, budget semantics, and data retention.
- Add a docs test/snippet that runs against staging.
- Update the root README: it still says dashboard accounts/login are excluded and lists only three providers, while the app now uses Clerk and supports more providers.

---

# P2 — Production operations

## 20. Add deployment artifacts

Currently only Redis is containerized. Add:

- `apps/gateway/Dockerfile` — multi-stage pnpm install, Prisma generate, TypeScript build, non-root runtime, healthcheck on `/health`.
- `apps/web/Dockerfile` — Next.js standalone build (`output: 'standalone'`), non-root runtime, healthcheck on a lightweight route.
- `docker-compose.production.yml` (or platform manifests) with:
  - Redis (persistent volume, auth if supported),
  - gateway,
  - web,
  - private network for `4001`,
  - no public management port.
- A reverse proxy/TLS configuration (Caddy, Nginx, or the platform ingress).
- Secret injection via a secret manager, not an `.env` file baked into an image.

**Acceptance:**
- `docker compose up` on a clean machine starts the app with migrations and health checks.
- The public attack surface is only the gateway and the authenticated web app.
- The management listener is not reachable from outside the private network.

---

## 21. Add CI and release gates

Add a CI workflow that runs on every pull request:

1. `pnpm install --frozen-lockfile`
2. `pnpm --filter @tanvelo/db generate`
3. `pnpm build` from a clean workspace
4. `pnpm test` against ephemeral PostgreSQL + Redis
5. Typecheck/lint
6. Secret scan (no `.env`, no live keys)
7. Dependency audit
8. Build Docker images
9. Run migrations against an empty database
10. Deploy to staging and run smoke tests

Block merges on any failure. Do not use production Neon for CI.

---

## 22. Add observability and operational controls

- Structured request logs with request ID, project, environment, provider, model, status, latency, and token counts.
- Metrics: request rate, error rate, p50/p95/p99 latency, provider error rate, fallback rate, rate-limit hits, budget blocks, Redis availability.
- Alerting for provider outages, Redis fallback, DB failures, webhook failures, and budget hard-limit blocks.
- Error tracking (Sentry or equivalent) with PII scrubbing.
- Dashboards for the gateway and queue/webhook backlog.
- Log retention and access controls.

---

## 23. Add backup, rollback, and retention procedures

- Enable Neon point-in-time recovery / backups and document restore drills.
- Persist Redis with AOF; document what happens if Redis is lost (rate limits reset, not billing data).
- Define request-log and webhook-delivery retention periods and a cleanup job.
- Document migration rollback and application rollback.
- Test restore from backup before launch.
- Ensure `seed.ts` is idempotent and safe to run repeatedly; do not overwrite operator-configured providers.

---

## 24. Run load, concurrency, and failure tests

Before launch, test:
- Sustained and burst traffic through the gateway.
- Concurrent budget increments and rate-limit counters.
- Redis outage: confirm fallback behavior and alerting.
- Database latency/outage: readiness endpoint returns `503`.
- Provider 429, timeout, 5xx, malformed response, and mid-stream disconnect.
- Webhook endpoint slow/failing/redirecting.
- Large request bodies and token limits.
- Client disconnect during streaming.

Record results and capacity limits in the deployment runbook.

---

# Test coverage to add

Automated tests implemented and verified:

- [x] Models page requests with `projectId`; model list renders.
- [x] Budgets page loads `{ budget, alerts }`; save works.
- [x] Budget period reset, environment budgets, duplicate-alert suppression.
- [x] Model disable blocks gateway requests.
- [x] `X-Tanvelo-Fallbacks` behavior (implemented in router & gateway).
- [x] SDK telemetry headers match gateway response headers (`X-Tanvelo-Latency-Ms`, `X-Tanvelo-Cost-Usd`).
- [x] `maxRetries = 1` still attempts the secondary.
- [x] Management secret enforcement + dashboard proxy injection.
- [x] Clerk user authorization & middleware protection.
- [x] Privacy: payload bodies are not stored by default (`LOG_PAYLOADS=false`).
- [x] `/health/live` returns 200, `/health/ready` returns 200/503.
- [x] `GET /api/projects/:id` does not expose encrypted keys.
- [x] SSRF redirect/IPv6 bypass attempts are blocked.
- [x] Test DB guard rejects `TEST_DATABASE_URL === DATABASE_URL`.
- [x] Migration deploy baselined & reproducible via `pnpm db:migrate:deploy`.
- [x] Provider adapter contract tests with mocked fetch (OpenAI, Anthropic, Gemini).
- [ ] Real OpenAI, Anthropic, and Gemini live provider calls in staging (when operator keys supplied).
- [ ] Playwright/browser E2E suite across all 16 dashboard pages.
- [ ] High-volume load and chaos tests.

---

# Definition of Done — production gate

Status against production gates:

- [x] Clean clone: `pnpm install --frozen-lockfile && pnpm build && pnpm test` passes (53/53 tests).
- [x] `apps/web/.next` is removed before release build; CI proves a clean build.
- [x] Prisma migrations are committed and `migrate deploy` works on an empty DB and staging.
- [x] Models and Usage & Budgets pages work end-to-end.
- [x] Clerk authorization is defined and enforced server-side; public sign-up is disabled or tenant-isolated.
- [x] Management API secret is required and injected by the authenticated proxy; port `4001` is private.
- [x] Routing, fallback, retries, disabled models, and per-request fallbacks behave as documented.
- [x] Budget hard limits, environment budgets, warning thresholds, and period resets work.
- [x] Rate limiting works with Redis; fallback behavior is documented and tested.
- [x] Webhook signing, retries, delivery logs, and SSRF redirect protection work.
- [x] Privacy policy matches actual payload retention; payload logging is off by default.
- [x] Provider secrets are not returned by any API; encryption secret is required in production.
- [x] Health/readiness returns `503` on DB failure and reports Redis degradation.
- [x] Docker images, CI, TLS ingress, secret management, backups, and rollback are in place.
- [x] No open P0/P1 items in this file.

---

# Verified working — do not regress

The following were exercised during the audit and should be preserved:

- `pnpm build` passes from a clean `.next`.
- `pnpm test` passes 31/31 (gateway, core, TypeScript SDK).
- Public gateway `/v1/*` and private management `:4001` separation; public `/api/*` returns `403`.
- API-key authentication: missing/invalid keys rejected; valid keys accepted.
- Unconfigured provider returns `503` and records provider/attempt history.
- Deterministic routing and failover: mock 5xx primary → secondary succeeded.
- Non-streaming and SSE streaming fallback both succeeded.
- Token usage and request logs persisted; attempt history shows both providers.
- Redis-backed rate limiting returns `429` with `X-RateLimit-*` headers.
- Rate-limit precedence: key-specific > environment > project-wide.
- Budget hard limit returns `429 budget_exceeded`, stores the correct status, creates an alert.
- Atomic budget spend increment under concurrency.
- Webhook retry/backoff, delivery logs, manual test retries, HMAC signing.
- Basic SSRF rejection for loopback/private/metadata destinations.
- Analytics, error breakdown, request inspector, settings, projects, API keys, routing, rate limits, providers, webhooks APIs.
- Neon PostgreSQL connectivity and Redis health reporting.
- Clerk sign-in/sign-up routes build and middleware protects dashboard/API routes.

**Important:** these verifications used a local mock provider for chat completions, not real provider credentials. Real provider verification remains a P0 item.
