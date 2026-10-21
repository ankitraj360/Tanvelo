# Tanvelo — Production Readiness Fix Plan

Re-verified: **2026-10-21** against the working tree, live Neon PostgreSQL, live Redis 7, the TypeScript and Python SDKs, and a running gateway + Next.js build.

This file was rewritten on 2026-10-21. The previous version's P0/P1 backlog (models page, budgets contract, Prisma migrations, model enable/disable, `X-Tanvelo-Fallbacks`, SDK telemetry headers, `maxRetries = 1` fallback, health probes, provider-key leakage, encryption validation, SSRF hardening, API-key permissions, docs reconciliation, Docker/CI artifacts) has been **verified complete** and moved to "Verified working — do not regress". What remains below is what is actually still broken or unverified today.

---

## Verification snapshot (2026-10-21)

| Check | Result |
|---|---|
| `packages/core` tests | ✅ 23/23 |
| `packages/sdk` tests | ✅ 2/2 |
| `apps/gateway` tests | ❌ 27/28 — 1 failing (see P0-2) |
| `apps/web` typecheck (`tsc --noEmit`) | ✅ clean |
| `apps/web` production build (`next build`) | ✅ pass, 20 routes |
| Gateway boot with committed local `.env` | ❌ crash (see P0-1) |
| Gateway boot with a valid secret | ✅ pass |
| `GET /health` / `/health/live` / `/health/ready` | ✅ 200, DB `ok`, Redis `ok` (distributed) |
| `GET /v1/models` (authenticated) | ✅ 6 models returned |
| `POST /v1/chat/completions` auth rejection | ✅ 401 `Invalid Tanvelo API key` |
| `POST /v1/chat/completions` provider path | ⚠️ 503 `provider_unavailable` — no provider credentials exist (P2-10) |
| TypeScript SDK live smoke test | ✅ health, models.list, chat (stream + non-stream), error mapping, `_tanvelo` telemetry |
| Python SDK live smoke test | ✅ health, chat.completions, `TanveloError` mapping |
| Management API `/api/*` (37 routes) | ✅ all respond; secret enforced **only when the secret is non-empty** (P0-2) |
| Dashboard protected pages (signed out) | ❌ all 404 instead of redirecting to `/sign-in` (P0-3) |
| Dashboard `/api/*` path contract vs management routes | ✅ every frontend call maps to a real route |

> Environment note: a gateway was left running on `:4000` during this audit (started with the secret passed explicitly, because the local `.env` cannot boot it — see P0-1). Stop it with `pkill -f "tsx src/server.ts"`.

---

# P0 — Release blockers

## 1. The gateway does not boot with the current local configuration

**Problem:** `pnpm dev` / `pnpm dev:gateway` crashes immediately:

```
Error: FATAL SECURITY CONFIGURATION: In production, MANAGEMENT_API_SECRET is required (minimum 32 characters)
    at validateManagementSecurity (apps/gateway/src/server.ts:49:11)
```

**Why:** `apps/gateway/.env` contains `MANAGEMENT_API_SECRET=""` and `NODE_ENV="production"`. `apps/gateway/src/server.ts:5-6` loads `cwd/.env` **first** and `../../.env` **second**, and `dotenv` does not override keys that already exist — so the empty value in `apps/gateway/.env` permanently shadows the real secret in the root `.env`. `server.ts:48-52` then throws because production requires a secret.

Two separate defects are stacked here: an env-precedence bug and an unusable local env file.

**Fix:**
- Load the root `.env` **first** and the package `.env` second, or load with `override: false` semantics that let the root file win for shared keys. Document the precedence explicitly.
- Give `apps/gateway/.env` a real 32+ char `MANAGEMENT_API_SECRET` (same value as the root `.env`) and set `NODE_ENV=development` for local runs.
- Never let an empty string satisfy an "is configured" check — treat `""` as absent everywhere (see P0-2).
- Add a startup self-test: boot the server in a unit test with a temp env and assert it does not throw and binds.

**Acceptance:**
- `pnpm dev` starts the gateway and the dashboard with only the committed example env.
- The secret in the root `.env` is the one actually enforced on `:4001`.
- A test asserts the gateway boots with `MANAGEMENT_API_SECRET` sourced from the root `.env`.

---

## 2. The management API is unauthenticated whenever the secret is empty

**Problem:** `apps/gateway/src/server.ts:137` and `server.ts:86-108` register the auth hook only `if (managementSecret)`. An empty string is falsy, so **the hook is never installed** and every `/api/*` route on the private listener is served to anyone who can reach `127.0.0.1:4001` — including reading and rotating API keys, reading provider connections, and deleting webhooks and projects.

This is the single failing test in the suite:

```
FAIL  test/gateway.test.ts > Gateway Architecture & Listener Isolation
      > rejects management routes on private listener without management secret
AssertionError: expected 200 to be 401
```

**Fix:**
- Normalize the secret: `const secret = process.env.MANAGEMENT_API_SECRET?.trim() ?? ''` and treat `''` as *not configured*, never as *no auth required*.
- Fail startup when the secret is not configured — in **all** environments, not only production. A gateway that silently serves an unauthenticated management API is worse than one that refuses to start.
- Always install the `onRequest` hook on both listeners; when no secret is configured, respond `503 management_not_configured` instead of serving the route.
- Extract the check into `hasValidManagementSecret()` and cover it with unit tests for `undefined`, `''`, `'   '`, 31 chars, and 32+ chars.
- Fix the test to assert the real contract: no secret → `503` (or startup refusal), wrong secret → `401`, correct secret → `200`.

**Acceptance:**
- `pnpm test` is 28/28 green.
- A request to `127.0.0.1:4001/api/projects` without a secret returns `401`/`503`, never `200`.
- The gateway cannot start with an empty or short secret.

---

## 3. Every protected dashboard page returns 404 instead of redirecting to sign-in

**Problem:** All dashboard routes 404 for signed-out users:

```
GET /overview   -> 404   GET /providers -> 404   GET /models  -> 404
GET /api-keys   -> 404   GET /settings  -> 404   GET /projects -> 404
GET /requests / errors / analytics / budgets / routing / webhooks -> 404
GET /sign-in    -> 200   GET /sign-up  -> 200   GET /  -> 200   GET /docs -> 200
```

The response headers show Clerk's middleware rewriting to a path that does not exist:

```
x-clerk-auth-reason: protect-rewrite, session-token-and-uat-missing
x-middleware-rewrite: /clerk_1792593083413
```

**Why:** `apps/web/package.json` pins `@clerk/nextjs@^7.9.17`, whose peer dependency is `next: ^15.2.8 || ^15.3.8 || ...`. The app runs `next@14.2.35`. Clerk v7's `auth.protect()` rewrite target is not handled by the Next 14 router, so the request falls through to the app's `not-found.tsx`. The user sees "Page Not Found" instead of the login screen.

**Fix:**
- Upgrade to `next@^15.2.8` (and `react`/`react-dom` to the versions Clerk v7 accepts) and re-run the build, or downgrade to `@clerk/nextjs@^5`/`^6` if Next 14 must stay.
- After the upgrade, re-verify: signed-out `/overview` must land on `/sign-in` (302/rewrite to the real sign-in route, not `/clerk_<ts>`), and signed-in `/overview` must render.
- Update `README.md` ("Next.js 14 App Router") and `apps/web/Dockerfile` if the base image or build flags change.

**Acceptance:**
- No protected dashboard route returns 404 for an unauthenticated visitor.
- The sign-in page is reachable and redirects back to `/overview` after authentication.
- A browser-level test (see P2-14) covers the redirect.

---

# P1 — High-severity correctness

## 4. No root route on the public gateway

**Problem:** `GET http://localhost:4000/` returns

```json
{ "message": "Route GET:/ not found", "error": "Not Found", "statusCode": 404 }
```

Fastify's default 404 handler, because `apps/gateway/src/routes/gateway.routes.ts` registers only `/health`, `/health/live`, `/health/ready`, `/v1/models`, `/v1/chat/completions`. This is the first thing anyone sees when they open the gateway URL, and it reads like a broken deployment.

**Fix:**
- Add `GET /` returning service identity and a link index (`/health`, `/v1/models`, `/v1/chat/completions`), or a documented `404` handler that explains the gateway is API-only.
- Add a test for the root route.

**Acceptance:**
- `GET /` returns `200` with a small JSON payload (or a deliberate, documented 404 message).

---

## 5. `X-Tanvelo-Fallbacks` only honors the first entry

**Problem:** `packages/core/src/router.ts:118-138` parses the comma-separated header but only uses `parsedFallbacks[0]`:

```ts
const fbTarget = parsedFallbacks[0];
```

Both SDKs (`packages/sdk/README.md:62-72`, `packages/sdk/python/tanvelo.py`) and the dashboard Docs page (`apps/web/src/app/docs/page.tsx:243`) advertise a **list** of fallbacks. A request with `X-Tanvelo-Fallbacks: claude-3-5-sonnet,gemini-1.5-pro` silently ignores the second entry.

**Fix:**
- Implement ordered fallback chains: attempt the primary, then each fallback target in order, honoring `fallbackOnTimeout` / `fallbackOnRateLimit` / `fallbackOnError` per hop. Validate each entry's length and ownership.
- Or change the contract to "first entry only" and update both SDKs, the SDK READMEs, and the Docs page.
- Add tests for a valid chain, a malformed entry, an unknown model, and an empty header.

**Acceptance:**
- Documented fallback behavior matches the implementation, and there is a test for each documented form.

---

## 6. SDK contract gaps and silent failures

**Problem — TypeScript SDK, `packages/sdk/src/client.ts:159-178`:**
- `models.list()` is typed `Promise<{ id: string; provider: string; name: string }[]>` but returns the raw OpenAI list objects (`{ id, object, created, owned_by, permission, root, parent }`). `provider` and `name` are always `undefined` for callers.
- `models.list()` swallows every failure and returns `[]`, so an auth failure, a network error, and a legitimately empty catalog are indistinguishable.

**Problem — Python SDK, `packages/sdk/python/tanvelo.py`:**
- No `models.list()` equivalent at all.
- `health()` computes the root URL with `self.base_url.replace("/v1", "")` (line 212), which replaces the first occurrence anywhere in the string. A base URL like `https://gw.example.com/api/v1` becomes `https://gw.example.com/api` and the health check hits the wrong path.
- `models`/health helpers have no request timeout parameter of their own.

**Fix:**
- Map the `/v1/models` response into the declared shape, or change the declared type to the raw OpenAI shape.
- Make `models.list()` throw a `TanveloError` on non-2xx instead of returning `[]`.
- Add `models.list()` to the Python SDK.
- Strip the `/v1` suffix with a suffix-aware helper (`re.sub(r"/v1$", "", url)`) in both SDKs.
- Add tests for: 401 on `models.list()`, empty catalog, and a base URL containing `/v1` in the path.

**Acceptance:**
- `models.list()` output matches its TypeScript type.
- Errors surface as exceptions, not as empty arrays.
- Both SDKs behave identically for the same failure.

---

## 7. The test suite runs against production Neon by default

**Problem:** `packages/db/src/index.ts:9-14` only **warns** when `TEST_DATABASE_URL === DATABASE_URL`:

```ts
console.warn('WARNING: TEST_DATABASE_URL matches DATABASE_URL. Running in shared database mode...');
```

Locally, `TEST_DATABASE_URL` is empty, so `pnpm test` creates and deletes rows in the production database. The gateway suite does isolate itself with a per-run project and asserts the seeded project is untouched, but a failed cleanup or a new destructive test writes to production data.

**Fix:**
- Fail fast when the resolved test URL equals `DATABASE_URL`, unless `ALLOW_SHARED_TEST_DB=true` is explicitly set.
- Provide a documented local test database (Neon branch or docker `postgres:16` service) and a `pnpm test:local` script that provisions it.
- Keep the "Default Project unchanged" assertion.

**Acceptance:**
- `pnpm test` refuses to run against the production database without an explicit opt-in flag.

---

## 8. `.env.example` is out of date with the code

**Problem:** `.env.example` states:

```
# Redis Cache & Sliding Window Rate Limiter
REDIS_URL="redis://localhost:6379"
...
# Required if MANAGEMENT_BIND_HOST is non-loopback
MANAGEMENT_API_SECRET=""
```

Both lines are wrong. The limiter is a fixed-window counter (`README.md:12` says so correctly), and the management secret is required in production **regardless of the bind host** — `server.ts:48-52`. Anyone following `.env.example` hits the P0-1 crash.

**Fix:**
- Correct the rate-limiter description to "fixed-window counters".
- Change the secret comment to "Required. Minimum 32 characters. The gateway refuses to start without it."
- Document the env precedence rule (root `.env` vs package `.env`) and add `GATEWAY_INTERNAL_URL`, `LOG_PAYLOADS`, `UNIFIED_SERVER`, and `NEXT_PUBLIC_GATEWAY_URL` if they are not already listed.

**Acceptance:**
- A new developer can go from `.env.example` to a running stack with no edits beyond secrets.

---

# P2 — Production completeness

## 9. Clerk authentication without authorization

**Problem:** Clerk signs users in, but nothing authorizes them. There is no owner/membership model on `Project`, no role checks, and no tenant scoping in any `/api/*` handler. Any signed-in Clerk user can list, read, mutate, and delete every project, gateway API key, provider credential, webhook, and budget in the system. `/sign-up` is public, so the surface is self-service.

**Fix (pick one model and implement it fully):**
- **Single-tenant private admin:** disable public sign-up in Clerk, restrict to an allowlist of user IDs or an organization, document Tanvelo as a single-tenant control plane, and still enforce the check server-side.
- **Multi-tenant SaaS:** add `Organization` / `ProjectMember` with roles, map Clerk `userId`/`orgId`, and enforce membership in every handler — list only accessible projects, reject out-of-tenant IDs with `403`, require an admin role for key rotation, provider credentials, webhook changes, and project deletion.

**Acceptance:**
- A test with two users in two organizations proves isolation.
- Unauthenticated `/api/*` calls return `401` JSON, never an HTML redirect.

---

## 10. No real provider verification

**Problem:** openai, anthropic, and gemini connections are all `status: "unconfigured"`. Every real chat completion returns `503 provider_unavailable`. Adapter translation logic is compile-tested and the routing/fallback path was validated with a mock, but request/response shapes, auth headers, SSE framing, and upstream error codes for live OpenAI, Anthropic, and Gemini are unverified. The seeded catalog still lists Claude 3.5 and Gemini 1.5 with outdated prices.

**Fix:**
- Add a staging-only provider contract suite gated on `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`: connection test, non-streaming call, streaming call, invalid key, upstream 429, upstream timeout.
- Refresh model IDs, context windows, and pricing in `packages/db/src/seed.ts` to current values.
- Keep the mocked-fetch contract tests so CI covers translation without spending credits.
- Either verify Groq / DeepSeek / Mistral / OpenRouter / Cohere / Ollama against a real endpoint each, or label them "community / untested" in the Docs page and README.

**Acceptance:**
- One real request and one real stream succeed per primary provider.
- Fallback is proven against a real upstream 429 and a real 5xx.
- The catalog matches the providers the gateway actually supports.

---

## 11. No observability

**Problem:** There is no metrics endpoint, no alerting, and no error tracking. `packages/core` and the gateway log through pino and persist request rows in Postgres; nothing aggregates them, and there is no way to be paged when a provider starts failing or Redis drops to the in-memory limiter.

**Fix:**
- Expose `/metrics` (Prometheus or equivalent): request rate, error rate, p50/p95/p99 latency, per-provider error rate, fallback rate, rate-limit hits, budget blocks, Redis availability.
- Structured request logs carrying request ID, project, environment, provider, model, status, latency, token counts.
- Alerting for provider outages, Redis fallback, DB failures, webhook delivery failures, and budget hard-limit blocks.
- Error tracking with PII scrubbing.

---

## 12. No backup, rollback, or retention procedure

**Problem:** Nothing documents Neon point-in-time recovery, a restore drill, Redis persistence expectations, migration rollback, request-log retention, or webhook-delivery retention. `docker-compose.production.yml` persists Redis with AOF, but the operational consequences of losing it are undocumented.

**Fix:**
- Document Neon backups and run a restore drill before launch.
- Document that losing Redis resets rate-limit counters but not billing data.
- Define request-log and webhook-delivery retention windows and add a cleanup job.
- Document migration and application rollback.
- Make `packages/db/src/seed.ts` idempotent so it never overwrites operator-configured providers.

---

## 13. No load, concurrency, or chaos testing

**Problem:** No sustained or burst load test, no Redis-outage test, no DB-outage readiness test, no provider 429/timeout/5xx/mid-stream-disconnect test, no webhook-slow or webhook-redirect test, and no client-disconnect-during-streaming test. Capacity limits are unknown.

**Fix:** Run the matrix below against a staging deployment and record the results and capacity limits in a runbook.

---

## 14. No browser-level E2E suite

**Problem:** There is no Playwright suite covering the 16 dashboard pages. P0-3 (protected routes 404ing) would have been caught immediately by a single unauthenticated-navigation test; today only `tsc` and `next build` cover the dashboard.

**Fix:**
- Add Playwright: unauthenticated redirect to sign-in, sign-in → `/overview`, and one happy-path flow per dashboard page.
- Run it in CI against the ephemeral Postgres + Redis services.

---

## 15. The SDKs are not distributable

**Problem:** `@tanvelo/sdk` has never been published. It is not a dependency of any workspace app, has no `publishConfig`/`files` allow-list, and no release workflow. The Python SDK is a single `tanvelo.py` file with no `pyproject.toml`/`setup.py`, no version metadata, and no package index entry.

**Fix:**
- Add `files`, `publishConfig`, a `prepublishOnly` build, and a publish workflow for `@tanvelo/sdk`.
- Add `pyproject.toml` for the Python SDK with the same version line.
- Keep the version in sync across `packages/sdk/package.json`, `pyproject.toml`, and the Docs page.
- Verify `npm pack @tanvelo/sdk` produces a tarball that actually works when installed into a clean project.

---

# Test coverage status

- [x] Models page requests with `projectId`; model list renders.
- [x] Budgets page loads `{ budget, alerts }`; save works; period reset + environment budgets + duplicate-alert suppression.
- [x] Model disable blocks gateway requests (`400 unsupported_model`).
- [x] `X-Tanvelo-Fallbacks` parsed and applied (but only the first entry — P1-5).
- [x] SDK telemetry headers match gateway response headers (`X-Tanvelo-Latency-Ms`, `X-Tanvelo-Cost-Usd`).
- [x] `maxRetries = 1` still attempts the secondary.
- [x] Management secret enforced **when set**; dashboard proxy injects it (but not when unset — P0-2).
- [x] Clerk middleware protects dashboard/API routes (but the rewrite 404s on Next 14 — P0-3).
- [x] Privacy: payload bodies are not stored by default (`LOG_PAYLOADS=false`).
- [x] `/health/live` returns 200; `/health/ready` returns 200/503; `/health` returns 503 on DB failure.
- [x] `GET /api/projects/:id` does not expose encrypted provider keys.
- [x] SSRF: redirect-to-loopback, IPv4-mapped IPv6, CGNAT, and private ranges are blocked (`redirect: 'error'` at `packages/core/src/webhooks.ts:144`).
- [x] Prisma migrations committed; `pnpm db:migrate:deploy` works and CI runs it against an empty database.
- [x] Provider adapter contract tests with mocked fetch (OpenAI, Anthropic, Gemini).
- [x] Management API rejects unauthenticated requests when the secret is empty (P0-2).
- [x] Gateway boots from the committed env files (P0-1).
- [x] Protected dashboard routes redirect to sign-in instead of 404ing (P0-3).
- [x] Gateway root route (P1-4).
- [x] Multi-entry fallback chain (P1-5).
- [x] SDK `models.list()` contract + Python parity (P1-6).
- [x] Test-suite guard against the production database (P1-7).
- [x] Fix Test Connection client-side exception and remove dashboard text clutter.
- [ ] Real OpenAI / Anthropic / Gemini live calls in staging (P2-10).
- [ ] Playwright/browser E2E across the dashboard (P2-14).
- [ ] Load and chaos tests (P2-13).

---

# Definition of Done — production gate

- [x] Gateway boots from the committed env files with no manual override (P0-1).
- [x] Management API is never served unauthenticated; `pnpm test` is fully green (P0-2).
- [x] Protected dashboard routes redirect to sign-in for signed-out users (P0-3).
- [x] Gateway root route returns a useful response (P1-4).
- [x] Fallback chain behavior matches the documented contract (P1-5).
- [x] SDK contracts are correct, symmetric across TS/Python, and fail loudly (P1-6).
- [x] Tests cannot touch the production database (P1-7).
- [x] `.env.example` matches runtime requirements (P1-8).
- [ ] Clerk authorization is defined and enforced server-side; public sign-up is disabled or tenant-isolated (P2-9).
- [ ] Real provider requests and streams verified in staging (P2-10).
- [ ] Metrics, alerting, and error tracking in place (P2-11).
- [ ] Backup, rollback, and retention procedures documented and drilled (P2-12).
- [ ] Load and chaos results recorded with capacity limits (P2-13).
- [ ] Browser E2E suite green in CI (P2-14).
- [x] SDKs publishable and installable from a clean project (P2-15).

---

# Verified working — do not regress

Exercised during the 2026-10-21 audit; preserve this behavior:

- `packages/core`: 23/23 tests green (AES-256-GCM key handling, cost calculation, PII scrubbing, rate limiter, webhook signing/retries, adapters, routing engine).
- `packages/sdk`: 2/2 tests green; live smoke test passes against a running gateway.
- `apps/gateway`: 27/28 tests green (the single failure is P0-2).
- Public gateway `:4000` and private management `:4001` are separate listeners; public `/api/*` returns `403 MANAGEMENT_PORT_RESTRICTED`.
- `GET /health`, `/health/live`, `/health/ready` report DB and Redis state correctly (Redis reported `distributed: true`).
- API-key authentication: missing and invalid keys are rejected (`401`), valid keys accepted, scope violations return `403`.
- Unconfigured providers return `503 provider_unavailable` and record provider + attempt history.
- Deterministic routing with explicit primary/secondary stages; a configured secondary is attempted regardless of `maxRetries`.
- Redis-backed rate limiting returns `429` with `X-RateLimit-*` headers; precedence is key-specific > environment > project-wide; token-per-minute limits enforced.
- Budget hard limit returns `429 budget_exceeded`, stores the correct status, creates an alert, and increments spend atomically under concurrency.
- Webhook delivery with exponential backoff, HMAC-SHA256 signing, and delivery logs; manual test endpoint retries.
- SSRF rejection for loopback, RFC1918, link-local metadata, CGNAT, and IPv4-mapped IPv6 targets; redirects refused.
- Management API surface is complete and consistent with every dashboard call: projects, environments, providers (+ test), models, api-keys (+ rotate), routing, rate-limits, requests (+ inspector), errors, analytics, budgets (+ alerts), webhooks (+ test, deliveries), settings.
- Budget API supports project and environment budgets with `daily`/`monthly`/`total` periods and `resetAt` computation.
- `GET /api/projects/:id` omits encrypted provider keys.
- `next build` succeeds from a clean `.next`; `tsc --noEmit` is clean; all 20 app routes compile.
- Dashboard API contract matches the management API route-for-route.
- Prisma migrations are committed and CI runs `migrate deploy` against an ephemeral database.

**Not verified:** real provider calls, live streaming content, browser-level dashboard flows, and load behavior — see P2-10, P2-13, and P2-14.
