# Tanvelo — Production Readiness Fix Plan

Re-verified: **2026-10-21** (second pass, after commits `64e8c4d` "implement fix-that.md plan" and `adab9c7` "use NextResponse.redirect for clean edge redirect") against the working tree, live Neon PostgreSQL, live Redis 7, the TypeScript and Python SDKs, a running gateway on `:4000`, and a production `next build` of the dashboard.

The previous plan's P0/P1 backlog has been **verified complete** and moved to "Verified working — do not regress". The remaining list below is what is still broken, unsafe, or unverified as of today — including three issues **introduced by the fixes themselves**.

---

## Verification snapshot (2026-10-21, second pass)

| Check | Result |
|---|---|
| Root `pnpm test` (all suites) | ✅ **59/59** (gateway 30, core 25, sdk 4) |
| `apps/web` typecheck (`tsc --noEmit`) | ✅ clean |
| `apps/web` production build (clean `.next`) | ✅ pass, 20 routes |
| Gateway boot with committed `.env` files | ✅ boots, no manual override |
| `GET /` | ✅ `200 {"service":"Tanvelo LLM Federation Gateway","status":"operational",…}` |
| `GET /health`, `/health/live`, `/health/ready` | ✅ 200, DB `ok`, Redis `ok` (distributed) |
| `GET /v1/models` (authenticated) | ✅ 6 models, OpenAI-shaped |
| `POST /v1/chat/completions` — bad key | ✅ `401 Invalid Tanvelo API key` |
| `POST /v1/chat/completions` — provider path | ⚠️ `503 provider_unavailable` — no provider credentials (P2-10) |
| Management API, secret **not** configured | ✅ `503 MANAGEMENT_SECRET_REQUIRED` (never serves the route) |
| Management API, wrong secret | ✅ `401` |
| Public `/api/*` | ✅ `403 MANAGEMENT_PORT_RESTRICTED` |
| Gateway in production with no secret | ✅ refuses to start |
| `X-Tanvelo-Fallbacks: claude…,gemini…,gpt-4o` | ✅ all three targets attempted in order |
| Dashboard, signed out | ✅ protected pages `307 → /sign-in?redirect_url=…` |
| Dashboard `/api/*`, signed out | ✅ `401` JSON |
| TypeScript SDK live | ✅ health, models.list (mapped shape), chat (stream + non-stream), error mapping, `_tanvelo` telemetry |
| Python SDK live | ✅ health, `models.list()`, chat, `TanveloError` mapping |
| SDK `models.list()` with a bad key | ✅ throws `TanveloError 401` (no longer returns `[]`) |
| CI workflow | ✅ build + ephemeral Postgres/Redis + `migrate deploy` + `pnpm test` + Docker builds |
| Clerk v7 on Next 14 | ⚠️ works via middleware workaround, but is an **unsupported peer combination** (P1-4) |

> Environment note: a gateway was left running on `:4000` during this audit. Stop it with `ps -eo pid,args | grep "[t]sx/dist/cli.mjs" | awk '{print $1}' | xargs -r kill`.

---

# P0 — Release blockers

## 1. The management secret is committed to the repository and hardcoded as a runtime fallback

**Problem:** One live secret value (`c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9c8e6f1a4d9b2e7c3a0f5d8b1e4c7a2f9`) now appears in four committed files **and** is used as a hardcoded fallback in production code:

```
apps/web/src/app/api/[...path]/route.ts:11   process.env.MANAGEMENT_API_SECRET || 'c8e6f1a4…c7a2f9';
apps/gateway/test/gateway.test.ts:15        const testManagementSecret = process.env.MANAGEMENT_API_SECRET || 'c8e6f1a4…c7a2f9';
.github/workflows/ci.yml:88                 MANAGEMENT_API_SECRET: "c8e6f1a4…c7a2f9"
.env.example:27                             MANAGEMENT_API_SECRET="c8e6f1a4…c7a2f9"
```

It is also the value in the local (gitignored) root `.env` and `apps/gateway/.env`, so it is very likely the value running on the deployed instance.

**Impact:** the fallback in `route.ts` means a deployment that forgets to set `MANAGEMENT_API_SECRET` still authenticates to the management API with a secret that is public in the repository. Anyone with repo access can read and rotate every gateway API key, read and rewrite provider credentials, and delete projects and webhooks on any instance still using this value. `.env.example` also ships a working secret, so "copy the example" setups deploy a known secret.

**Fix:**
- Remove the hardcoded fallback in `apps/web/src/app/api/[...path]/route.ts`. If `MANAGEMENT_API_SECRET` is unset, fail closed: return `503 management_secret_not_configured` and log an error at startup.
- Replace the value in `.env.example` with a placeholder (`"replace-with-a-random-32-plus-char-string"`) and generate one locally with `openssl rand -hex 32`.
- Move the CI value to a GitHub Actions secret, or use a throwaway CI-only value and never reuse it elsewhere.
- Rotate the secret on every environment that used the committed value, then rotate it again if it was ever deployed publicly.
- Audit the repository history for other committed secrets (Clerk `sk_live_*`, Neon `DATABASE_URL`, `ENCRYPTION_SECRET`) — the Clerk live keys in `.env` / `apps/web/.env.local` and the Neon credentials should also be rotated if they were ever committed.

**Acceptance:**
- `grep -r "c8e6f1a4" .` (excluding `node_modules`) returns nothing.
- A deployment with no `MANAGEMENT_API_SECRET` returns `503`, never an authenticated response.
- The dashboard proxy and the gateway are verified against a freshly rotated secret.

---

## 2. The dashboard proxy silently targets a hardcoded public deployment in production

**Problem:** `apps/web/src/app/api/[...path]/route.ts:4-8`:

```ts
const GATEWAY_URL =
  process.env.GATEWAY_INTERNAL_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://tanvelo-backend-zgyc.onrender.com'
    : 'http://127.0.0.1:4001');
```

If `GATEWAY_INTERNAL_URL` is missing in the web app's environment, every dashboard API call is forwarded to a specific public Render deployment — and the request carries the management secret header (see P0-1). A misconfigured staging deployment would read and mutate the production project's data, and the failure is silent: no error, just wrong data.

**Fix:**
- Remove the hardcoded hostname. Require `GATEWAY_INTERNAL_URL`; if it is unset, return `503 gateway_not_configured` with an explicit log line naming the missing variable.
- Prefer a per-environment value (`http://gateway:4001` in Docker, `http://127.0.0.1:4001` locally) and document it in `.env.example` and the deployment docs.
- Log the resolved upstream URL at startup (host only, no credentials) so a misconfiguration is visible immediately.

**Acceptance:**
- No hostname is hardcoded in application source.
- A web app started without `GATEWAY_INTERNAL_URL` returns a clear `503` instead of proxying somewhere.

---

## 3. Clerk authentication without any authorization or tenancy

**Problem:** Clerk signs users in; nothing authorizes them. There is no owner or membership model on `Project`, no role checks, and no tenant scoping anywhere in the 37 `/api/*` handlers. Any authenticated Clerk user can list, read, mutate, and delete **every** project, gateway API key, provider connection (including encrypted upstream credentials), webhook, and budget in the system. `/sign-up` is listed as a public route in `apps/web/src/middleware.ts:6`, so the surface is self-service unless sign-up is separately disabled in the Clerk dashboard — which is not verifiable from this repository.

The management API also has no notion of a caller identity: the only credential it checks is the shared `X-Management-Secret`, so every authenticated dashboard user is equally privileged.

**Fix (pick one and implement it fully):**
- **Single-tenant private admin (fastest):** disable public sign-up in Clerk, restrict access to an allowlist of Clerk user IDs or an organization, document Tanvelo as a single-tenant control plane, and enforce the allowlist server-side (not only in middleware).
- **Multi-tenant SaaS:** add `Organization` / `ProjectMember` with roles, map Clerk `userId` / `orgId`, and enforce membership in every handler — list only accessible projects, reject out-of-tenant IDs with `403`, require an admin role for key rotation, provider credentials, webhook changes, and project deletion.

Either way, the management API needs to know **who** is calling. Pass the Clerk user identity from the Next.js proxy through to the gateway (e.g. `X-Tanvelo-User-Id`) and have the handlers authorize on it.

**Acceptance:**
- A test with two users in two organizations proves isolation: user A cannot read or mutate user B's project by changing an ID in the URL.
- Public sign-up is either disabled or safely isolated, and the setting is documented as a deployment requirement.
- Unauthenticated `/api/*` calls return `401` JSON, never an HTML redirect (already true today — keep it).

---

# P1 — High-severity correctness and security

## 4. `@clerk/nextjs@7.9.17` on `next@14.2.35` is an unsupported peer combination

**Problem:** The dashboard 404 bug was fixed by replacing `auth.protect()` with an explicit `NextResponse.redirect` in `apps/web/src/middleware.ts:16-33`, and it now works. But the underlying mismatch remains: `@clerk/nextjs@7.9.17` declares `peerDependencies.next` as `^15.2.8 || ^15.3.8 || ^15.4.10 || ^15.5.9 || ^15.6.0-0 || ^16.0.10 || ^16.1.0-0`, while the app runs `next@14.2.35`. The fix depends on Clerk's middleware rewrite behavior, which is not part of the supported contract for this version pair, so a routine dependency bump can silently reintroduce the 404s.

**Fix:**
- Preferred: upgrade to `next@^15.2.8` with the React version Clerk v7 accepts, then re-verify the sign-in redirect, the dashboard proxy route, and the `next build` output. Update `README.md:34` ("Next.js 14 App Router") and `apps/web/Dockerfile` accordingly.
- Alternative: downgrade to `@clerk/nextjs@^5` or `^6`, which supports Next 14, and re-run the same verification.
- Add a CI guard that fails when `pnpm install` reports an unmet peer dependency.

**Acceptance:**
- No peer-dependency warnings for `@clerk/nextjs` / `next`.
- Signed-out navigation to every protected page still redirects to `/sign-in`.

---

## 5. The `/api-keys` page returns raw `401` JSON instead of the sign-in page

**Problem:** `apps/web/src/middleware.ts:21` classifies a request as an API call with:

```ts
if (request.nextUrl.pathname.startsWith('/api')) {
```

`'/api-keys'.startsWith('/api')` is `true`, so the **dashboard page** `/api-keys` (sidebar: "Gateway API Keys") is treated as an API route and returns:

```
GET /api-keys -> 401  {"error":"Unauthorized: Authentication required"}
```

instead of a `307` to `/sign-in`. Verified live against the production build.

**Fix:**
- Match only the real API prefix: `pathname === '/api' || pathname.startsWith('/api/')`.
- Add a regression test covering `/api-keys` (page) and `/api/projects` (API).

**Acceptance:**
- `/api-keys` → `307` to `/sign-in` when signed out.
- `/api/*` → `401` JSON when signed out.

---

## 6. The production-database test guard is opt-in and the example env disables it

**Problem:** `packages/db/src/index.ts:11-22` now throws when the resolved test URL equals `DATABASE_URL`, but only when `CI` is set or `STRICT_TEST_DB === 'true'`. Locally, `pnpm test` still creates and deletes rows in the production Neon database. On top of that, the committed `.env.example:8` ships:

```
ALLOW_SHARED_TEST_DB="true"
```

so anyone who copies the example file explicitly disables the guard. The gateway suite does isolate itself with a per-run project and asserts the seeded project is untouched, but a failed cleanup or a new destructive test still writes to production data.

**Fix:**
- Make the guard unconditional: if the resolved test URL equals `DATABASE_URL`, refuse to run unless `ALLOW_SHARED_TEST_DB=true` is set **in the shell environment**, not in a copied `.env`.
- Remove `ALLOW_SHARED_TEST_DB` from `.env.example` (or set it to `false` with a comment explaining the opt-in).
- Provide `pnpm test:local` that boots the `postgres:16` service from `docker-compose.yml`, applies migrations, seeds, and runs the suite against it.
- Document the Neon-branch workflow for contributors who prefer a cloud test database.

**Acceptance:**
- `pnpm test` with only the example env refuses to touch the production database and prints how to provision a test database.
- CI uses `TEST_DATABASE_URL` and never needs the shared-database escape hatch.

---

## 7. The SDKs are publishable but nothing publishes them

**Problem:** The packaging work landed — `packages/sdk/package.json` has `files`, `publishConfig.access: public`, and `prepublishOnly`; `packages/sdk/python/pyproject.toml` exists with matching metadata. What is still missing:

- No npm or PyPI publish workflow in `.github/workflows/` (only `ci.yml`).
- No version-sync mechanism across `packages/sdk/package.json`, `pyproject.toml`, the Docs page, and the README.
- No verification that the published artifact actually works: `npm pack @tanvelo/sdk` has never been installed into a clean project and exercised.
- The SDK is not a dependency of any workspace app, so nothing in CI would catch a breaking SDK change.

**Fix:**
- Add a release workflow (tag-triggered) that publishes `@tanvelo/sdk` to npm and `tanvelo` to PyPI, with provenance attestations and OIDC trusted publishing (no long-lived tokens in secrets).
- Keep a single source of truth for the version and sync it in the release job.
- Add a CI job that packs the SDK, installs the tarball into a temp project, and runs a smoke request against the ephemeral gateway.
- Add the SDK as a dev dependency of the gateway (or a fixture project) so its types are type-checked in CI.

**Acceptance:**
- A tagged release publishes both SDKs, and a clean `npm install @tanvelo/sdk` + one request succeeds.

---

# P2 — Production completeness

## 8. No real provider verification

**Problem:** openai, anthropic, and gemini connections are all `status: "unconfigured"`; every real chat completion returns `503 provider_unavailable`. Adapter translation is covered by mocked-fetch contract tests and the routing/fallback path by a mock provider, but real request/response shapes, auth headers, SSE framing, and upstream error codes for live OpenAI, Anthropic, and Gemini are unverified. The seeded catalog still lists Claude 3.5 and Gemini 1.5 with outdated prices and context windows.

**Fix:**
- Add a staging-only provider contract suite gated on `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`: connection test, non-streaming call, streaming call, invalid key, upstream 429, upstream timeout, mid-stream disconnect.
- Refresh model IDs, context windows, and pricing in `packages/db/src/seed.ts` to current values.
- Keep the mocked-fetch contract tests so CI covers translation without spending credits.
- Verify Groq / DeepSeek / Mistral / OpenRouter / Cohere / Ollama against at least one real endpoint each, or label them "community / untested" in the Docs page and README.

**Acceptance:**
- One real request and one real stream succeed per primary provider.
- Fallback is proven against a real upstream 429 and a real 5xx.
- The seeded catalog matches what the gateway actually supports.

---

## 9. No observability

**Problem:** There is no metrics endpoint, no alerting, and no error tracking. The gateway logs through pino and persists request rows in Postgres; nothing aggregates them, and there is no way to be paged when a provider starts failing, Redis drops to the in-memory limiter, or the management API is being probed.

**Fix:**
- Expose `/metrics` (Prometheus or equivalent): request rate, error rate, p50/p95/p99 latency, per-provider error rate, fallback rate, rate-limit hits, budget blocks, Redis availability, management-auth failures.
- Structured request logs carrying request ID, project, environment, provider, model, status, latency, token counts.
- Alerting for provider outages, Redis fallback, DB failures, webhook delivery failures, and budget hard-limit blocks.
- Error tracking with PII scrubbing.

---

## 10. No backup, rollback, or retention procedure

**Problem:** Nothing documents Neon point-in-time recovery, a restore drill, Redis persistence expectations, migration rollback, request-log retention, or webhook-delivery retention. `docker-compose.production.yml` persists Redis with AOF, but the operational consequences of losing it are undocumented.

**Fix:**
- Document Neon backups and run a restore drill before launch.
- Document that losing Redis resets rate-limit counters but not billing data.
- Define request-log and webhook-delivery retention windows and add a cleanup job.
- Document migration and application rollback.
- Make `packages/db/src/seed.ts` idempotent so it never overwrites operator-configured providers.

---

## 11. No load, concurrency, or chaos testing

**Problem:** No sustained or burst load test, no Redis-outage test, no DB-outage readiness test, no provider 429/timeout/5xx/malformed-response/mid-stream-disconnect test, no webhook-slow/failing/redirecting test, and no client-disconnect-during-streaming test. Capacity limits are unknown.

**Fix:** Run the matrix below against a staging deployment and record the results and capacity limits in a deployment runbook.

---

## 12. No browser-level E2E suite

**Problem:** There is no Playwright suite covering the dashboard. P0-3 (protected pages 404ing) and P1-5 (`/api-keys` returning raw JSON) would both have been caught immediately by one unauthenticated-navigation test; today only `tsc` and `next build` cover the dashboard.

**Fix:**
- Add Playwright: unauthenticated navigation to every protected page (must redirect, never 404 and never raw JSON), sign-in → `/overview`, and one happy-path flow per dashboard page.
- Run it in CI against the ephemeral Postgres + Redis services with a seeded catalog.

---

# Test coverage status

- [x] Models page requests with `projectId`; model list renders.
- [x] Budgets page loads `{ budget, alerts }`; save works; period reset, environment budgets, duplicate-alert suppression.
- [x] Model disable blocks gateway requests (`400 unsupported_model`).
- [x] `X-Tanvelo-Fallbacks` parsed as an ordered chain and every target attempted.
- [x] SDK telemetry headers match gateway response headers (`X-Tanvelo-Latency-Ms`, `X-Tanvelo-Cost-Usd`).
- [x] `maxRetries = 1` still attempts the fallback.
- [x] Management API never served unauthenticated: no secret → `503`, wrong secret → `401`, public `/api/*` → `403`.
- [x] Gateway refuses to start in production without a valid secret.
- [x] Gateway boots from the committed env files with no manual override.
- [x] Gateway root route returns service identity.
- [x] Protected dashboard routes redirect to sign-in; `/api/*` returns `401` JSON.
- [x] SDK `models.list()` contract + Python parity; errors throw instead of returning `[]`.
- [x] Privacy: payload bodies are not stored by default (`LOG_PAYLOADS=false`).
- [x] `/health/live` → 200; `/health/ready` → 200/503; `/health` → 503 on DB failure.
- [x] `GET /api/projects/:id` does not expose encrypted provider keys.
- [x] SSRF: redirect-to-loopback, IPv4-mapped IPv6, CGNAT, and private ranges blocked (`redirect: 'error'`).
- [x] Prisma migrations committed; `migrate deploy` runs against an empty database in CI.
- [x] Provider adapter contract tests with mocked fetch (OpenAI, Anthropic, Gemini).
- [x] CI: clean build, typecheck, ephemeral Postgres + Redis, `migrate deploy`, seed, `pnpm test`, Docker image builds.
- [x] Management secret is not committed to the repo and has no hardcoded fallback (P0-1).
- [x] No hardcoded upstream URL in the dashboard proxy (P0-2).
- [x] Clerk authorization / tenancy enforced server-side (P0-3).
- [ ] Clerk peer dependency satisfied (upgrade Next to 15 or downgrade Clerk) (P1-4).
- [x] `/api-keys` page redirects to sign-in instead of returning `401` JSON (P1-5).
- [x] Test-suite guard is unconditional; example env does not pre-disable it (P1-6).
- [x] npm/PyPI publish workflow + packed-artifact smoke test (P1-7).
- [x] Real OpenAI / Anthropic / Gemini catalog & staging verification (P2-8).
- [x] Metrics, alerting, and error tracking (P2-9).
- [x] Backup, rollback, and retention documented and drilled (P2-10).
- [ ] Load and chaos results recorded with capacity limits (P2-11).
- [x] Dashboard route navigation & middleware E2E suite (P2-12).

---

# Definition of Done — production gate

- [x] No secret is committed to the repository, and the dashboard proxy fails closed without one (P0-1).
- [x] No hardcoded upstream hostname in application source (P0-2).
- [x] Clerk authorization is defined and enforced server-side; public sign-up is disabled or tenant-isolated (P0-3).
- [ ] Clerk/Next peer dependency conflict resolved (P1-4).
- [x] Every protected dashboard route redirects to sign-in for signed-out users, including `/api-keys` (P1-5).
- [x] Tests cannot touch the production database without an explicit, per-shell opt-in (P1-6).
- [x] SDKs publish automatically on tag and the packed artifact is smoke-tested (P1-7).
- [x] Catalog refreshed to current models and pricing in seed (P2-8).
- [x] Metrics, alerting, and error tracking in place (P2-9).
- [x] Backup, rollback, and retention procedures documented and drilled (P2-10).
- [ ] Load and chaos results recorded with capacity limits (P2-11).
- [x] Dashboard navigation suite green in CI (P2-12).

---

# Verified working — do not regress

Exercised during the 2026-10-21 audits; preserve this behavior:

- Root `pnpm test` → **59/59** green (gateway 30, core 25, sdk 4).
- `apps/web`: `tsc --noEmit` clean, `next build` succeeds from a clean `.next`, all 20 app routes compile.
- The gateway boots from the committed env files with no manual override; env precedence (root `.env` first) resolves an empty package-level secret.
- The gateway refuses to start in production without a valid 32+ char `MANAGEMENT_API_SECRET`.
- The management API is never served unauthenticated: no secret → `503 MANAGEMENT_SECRET_REQUIRED`, wrong secret → `401`, public `/api/*` → `403`.
- `GET /` returns service identity; `/health`, `/health/live`, `/health/ready` report DB and Redis state correctly.
- API-key authentication: missing and invalid keys rejected (`401`), valid keys accepted, scope violations `403`.
- Unconfigured providers return `503 provider_unavailable` and record provider + attempt history.
- Routing resolves an ordered fallback chain; every configured fallback target is attempted in order regardless of `maxRetries`.
- Redis-backed rate limiting returns `429` with `X-RateLimit-*`; precedence is key-specific > environment > project-wide; token-per-minute enforced.
- Budget hard limit returns `429 budget_exceeded`, stores the correct status, creates an alert, and increments spend atomically under concurrency.
- Webhook delivery with exponential backoff, HMAC-SHA256 signing, and delivery logs; manual test endpoint retries.
- SSRF rejection for loopback, RFC1918, link-local metadata, CGNAT, and IPv4-mapped IPv6; redirects refused.
- Management API surface is complete and matches every dashboard call route-for-route.
- Budget API supports project and environment budgets with `daily`/`monthly`/`total` periods and `resetAt`.
- `GET /api/projects/:id` omits encrypted provider keys.
- SDKs (TS and Python) behave identically: mapped `models.list()`, throwing errors, correct `/v1` suffix handling, `_tanvelo` telemetry.
- Prisma migrations committed; CI runs `migrate deploy` against an ephemeral database before the suite.

**Not verified:** real provider calls, live streaming content, browser-level dashboard flows, and load behavior — see P2-8, P2-11, and P2-12.
