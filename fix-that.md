# Tanvelo — Remaining Fixes

Re-verified on 2026-10-19 against the current code and the Neon database.

Current state: `pnpm build` passes and `pnpm test` passes 21/21, but the test suite is destructive against a real database. The items below are the confirmed remaining defects and gaps. Fixed items have been removed from this file.

> **Do not run `pnpm test` against the Neon database until Critical #1 is fixed.** The current suite deletes the Default Project's OpenAI provider record.

Database status: Neon is already configured and working. `/health` reports the database as connected, and the suite ran against Neon. Redis is still required (local Docker Redis is fine). See the credential item below before making any commit.

---

## Critical

### 1. The test suite deletes real provider data from the Default Project

- **Problem:** `apps/gateway/test/gateway.test.ts` runs against the existing `default` project instead of a dedicated test project. The provider-status test upserts the Default Project's OpenAI connection with a fake key and then deletes that row in `finally`.
- **Evidence:** After running `pnpm test` against Neon, the Default Project contains only `anthropic` and `gemini` provider connections. The `openai` row is gone.
- **Impact:** Running tests against Neon overwrites and then deletes real provider configuration. If the OpenAI connection had a real key, that key is now lost. Other tests also create budgets and rate-limit policies in the Default Project.
- **Where:**
  - `apps/gateway/test/gateway.test.ts:22-44` — selects the `default` project.
  - `apps/gateway/test/gateway.test.ts:404-441` — upserts a fake OpenAI connection and deletes the provider row.
- **Fix:**
  - Create a dedicated test project/environment/key per run (for example `vitest-<run-id>`), then delete the whole project in `afterAll`. Never use the seeded `default` project.
  - Prefer a separate Neon branch or database for tests. Add a `TEST_DATABASE_URL` guard so tests refuse to run if it points at the production database.
  - Only delete records the test created. Do not delete or overwrite a pre-existing provider, budget, policy, or key.
  - Clean up every created record: requests, attempts, usage records, budgets, alerts, rate-limit policies, webhooks/deliveries, and API keys.
  - Add an assertion or startup guard that the Default Project is unchanged by the suite.
- **Immediate recovery:** Re-add the OpenAI provider connection to the Default Project and re-enter its key if one existed.

---

### 2. Budget hard-limit blocks are recorded as `rate_limited` and do not emit `budget.exceeded`

- **Problem:** The pre-request budget failure path records the request with status `rate_limited`. The `recordRequest()` status union does not even include `budget_exceeded`.
- **Evidence:** A hard limit of `$0` correctly returned HTTP 429 with `error.type = budget_exceeded`, but the stored request had `status = rate_limited`. A webhook subscribed to `budget.exceeded` received no delivery.
- **Impact:** Budget-blocked requests appear under the wrong status in the dashboard and error filters, and alerts/webhooks are missed.
- **Where:**
  - `apps/gateway/src/routes/gateway.routes.ts:119-134` — budget catch records `status: 'rate_limited'`.
  - `apps/gateway/src/services/gateway.service.ts:263` — allowed status union omits `budget_exceeded`.
  - `apps/gateway/src/services/gateway.service.ts:388-402` — `budget.exceeded` is emitted only after a successful request pushes spend over the limit, not when `checkBudget()` blocks a request.
- **Fix:**
  - Add `budget_exceeded` to the `recordRequest()` status type.
  - Record the hard-limit request with status `budget_exceeded`.
  - Emit the `budget.exceeded` webhook and create the budget-exceeded alert from the hard-limit catch path.
  - Prevent duplicate alerts/webhooks if the same request also crosses the threshold in `recordRequest()`.
  - Add an integration test that sets a `$0` hard limit, asserts the 429 type and stored status, and verifies the alert and webhook delivery.

---

### 3. Management API can still be exposed unauthenticated through configuration

- **Problem:** The default setup is now safe (public `:4000/api/*` returns 403; management is on `127.0.0.1:4001`; dashboard is on `127.0.0.1:3000`). However, `MANAGEMENT_API_SECRET` is optional and there is no startup validation. Setting `MANAGEMENT_BIND_HOST=0.0.0.0` or a LAN address with an empty secret exposes every management route without authentication. There is no refusal or warning.
- **Impact:** A configuration change can silently recreate the original critical exposure.
- **Where:**
  - `apps/gateway/src/server.ts:53-76` — auth hook is installed only when a secret is present.
  - `apps/gateway/src/server.ts:98-106` — management host is bound from the environment with no validation.
- **Fix:**
  - Detect loopback hosts (`127.0.0.1`, `::1`, `localhost`) before binding.
  - If the management host is non-loopback and `MANAGEMENT_API_SECRET` is empty, refuse to start in production and warn or force localhost in development.
  - Require a non-trivial secret whenever management routes are reachable over a network.
  - Add a unit test for the host/secret validation function.

---

## High

### 4. `/api/settings` reports the wrong Redis state and leaks connections

- **Problem:** The settings endpoint creates a new `RateLimiter` on every request and immediately calls `getStatus()`. The new instance's Redis connection has not completed yet, so it reports in-memory fallback even when Redis is healthy. The connection is never closed.
- **Evidence:** In a live check, `/health` reported `{"distributed":true,"backend":"redis"}` while `/api/settings` reported `distributed: false` and the in-memory fallback.
- **Impact:** Settings shows misleading infrastructure state and every request opens another Redis connection.
- **Where:** `apps/gateway/src/routes/management.routes.ts:935-936`.
- **Fix:**
  - Use the existing shared `RateLimiter` instance (or a shared status provider) instead of constructing one per request.
  - Do not open a Redis connection inside an HTTP request handler.
  - Close the limiter on shutdown.
  - Add a test asserting `/health` and `/api/settings` report the same backend, with Redis both up and down.

---

### 5. The live Neon credential is present in `.env`, which is not gitignored

- **Problem:** `.env` contains the real Neon password, and `.gitignore` only ignores `.env.local` and `.env.*.local`. All project files are currently untracked, so a plain `git add .` would commit the database credential. The previous version of this file also contained the live URL; this rewrite removes it.
- **Where:** `.gitignore:22-24`.
- **Fix:**
  - Add `.env` and `.env.*` to `.gitignore`, with an exception for `.env.example`.
  - Add a `.env.example` containing placeholders only.
  - Check the repository and shell history for the credential.
  - Rotate the Neon password if the old file or `.env` was ever committed, pushed, or shared.
  - Keep secrets out of Markdown documentation.

---

## Medium

### 6. Manual webhook test bypasses retry logic

- **Problem:** The automatic webhook path uses `dispatchWebhookWithRetries`, but `POST /api/webhooks/:id/test` still calls single-attempt `dispatchWebhook` and records only one delivery.
- **Where:** `apps/gateway/src/routes/management.routes.ts:899-914`.
- **Fix:**
  - Use `dispatchWebhookWithRetries` in the manual test endpoint.
  - Insert one `WebhookDelivery` row per attempt so the delivery history matches automatic events.
  - Return a summary containing all attempts.
  - Add a test covering the manual endpoint with a failing URL.

---

### 7. Documentation and local infrastructure still reference PostgreSQL

- **Problem:** Neon is in use, but the README architecture and Docker Compose setup still describe/start a local PostgreSQL 16 container. This is confusing and leaves an unused service.
- **Where:**
  - `README.md:43` — architecture lists PostgreSQL 16 and Redis 7 services.
  - `docker-compose.yml` — still defines the PostgreSQL service.
- **Fix:**
  - Update the README to list Neon as the database and Redis as the only required container.
  - Remove the PostgreSQL service from Docker Compose, or clearly mark it as an optional local fallback.
  - Keep the Neon setup notes, but do not include the live connection string.

---

### 8. Add regression tests for the remaining gaps

Add tests for:

- test isolation and a guard against running against the production database,
- budget hard-limit status, alert, and webhook,
- management host/secret startup validation,
- `/health` versus `/api/settings` Redis state,
- manual webhook test retries.

Run the suite only against the dedicated test database/branch.

---

## Verified working — do not redo

- Public/management listener separation: `:4000/api/*` returns 403, management is private, dashboard is localhost-only.
- Atomic budget spend increment.
- Rate-limit precedence: key > environment > project.
- `X-RateLimit-*` headers on success and 429.
- `tokensPerMinute` persistence and enforcement.
- Attempt history for unconfigured providers.
- `provider.unavailable` and `rate_limit.exceeded` webhook delivery, plus automatic retry/backoff.
- Server-side provider connection status.
- Neon database connectivity and Prisma schema.

Build and tests: `pnpm build` passes; `pnpm test` passes 21/21, but see Critical #1 before running it again.
