# Tanvelo — Production LLM API Gateway

Tanvelo is a production-oriented developer infrastructure SaaS LLM API Gateway that unifies access to OpenAI, Anthropic, and Google Gemini with deterministic routing, safe fallbacks, distributed rate limiting, token usage tracking, cost estimation, webhooks, and budget enforcement.

---

## Key Capabilities

- **Unified OpenAI-Compatible Gateway**: Exposes `POST /v1/chat/completions` with streaming Server-Sent Events (SSE) support and standardized error formatting.
- **Provider Adapters**: Extensible adapters for **OpenAI**, **Anthropic**, and **Google Gemini** with automatic request translation, response normalization, and live connection verification.
- **Deterministic Routing & Fallback**: Priority-based routing rules with automatic failover to secondary providers/models upon timeouts, rate-limits (HTTP 429), or upstream 5xx outages.
- **Distributed Rate Limiting**: Redis-backed atomic rate limiting (requests per minute, hour, day, and token limits) with standard `X-RateLimit-*` headers and resilient in-memory fallback.
- **API Key Security**: Gateway API keys generated with cryptographically secure randomness; keys displayed once on creation and stored strictly as SHA-256 hashes.
- **Provider Key Encryption**: Upstream provider credentials encrypted at rest using server-side **AES-256-GCM** with random initialization vectors and authenticated tags.
- **Zero Mock Data Policy**: All dashboard metrics, logs, and analytics originate from persisted PostgreSQL records or real provider responses. If no data exists, clear empty states are displayed.
- **Usage Budgets & Hard Cutoffs**: Project and environment budgets with warning thresholds and atomic hard-limit blocking to prevent runaway LLM costs.
- **Webhooks with SSRF Protection**: Signed HMAC-SHA256 event notifications (`X-Tanvelo-Signature`) with strict validation against loopback, private RFC1918, link-local, and cloud metadata IPs.
- **16 Complete Dashboard Pages**: Overview, Projects, Project Details, Providers, Models, API Requests, Request Inspector, Errors & Failures, Rate Limits, Analytics, Usage & Budgets, Routing & Fallbacks, API Keys, Webhooks, Developer Documentation, and Settings.

---

## Architecture

Tanvelo is structured as a modular TypeScript monorepo with clean separation between the high-performance gateway request path and the management dashboard:

```
├── apps/
│   ├── gateway/         # Fastify high-performance engine (:4000)
│   │   ├── src/
│   │   │   ├── routes/  # /v1/chat/completions, /v1/models, /health, /api/*
│   │   │   ├── services/# Gateway execution pipeline & persistence
│   │   │   └── server.ts
│   │   └── test/        # Gateway integration tests
│   └── web/             # Next.js 14 App Router dashboard (:3000)
│       └── src/
│           ├── app/     # 16 complete dashboard pages
│           ├── components/ # Reusable UI components & dark SaaS design system
│           └── context/ # Global project & environment isolation context
├── packages/
│   ├── core/            # Business logic: adapters, routing, crypto, rate limiter, webhooks
│   │   └── test/        # Unit & security tests
│   └── db/              # Prisma schema, migrations, and PostgreSQL client
├── docker-compose.yml   # Redis 7 service (Neon serverless is the primary database)
└── tanvelo-prd.md       # Product Requirements Document
```

---

## Quickstart

### 1. Prerequisites
- Node.js v20+ or v24
- pnpm v10+
- Neon PostgreSQL connection string (configured in `.env`)
- Redis 7 (via Docker Compose `docker compose up -d redis` or external Redis URL)

### 2. Start Redis Container
```bash
docker compose up -d redis
```

### 3. Install Dependencies & Build
```bash
pnpm install
pnpm build
```

### 4. Push Database Schema & Seed Catalog
```bash
pnpm db:generate
pnpm --filter @tanvelo/db exec prisma db push
pnpm db:seed
```

### 5. Run the Services
```bash
# Run both Gateway (:4000) and Web Dashboard (:3000) concurrently
pnpm dev

# Or run individually:
pnpm dev:gateway  # Starts Fastify Gateway on http://localhost:4000
pnpm dev:web      # Starts Next.js Dashboard on http://localhost:3000
```

### 6. Run the Test Suite
```bash
pnpm test
```

---

## Gateway API Usage

### Authentication
Authenticate with your Tanvelo API Key in the `Authorization` header:
```http
Authorization: Bearer YOUR_TANVELO_API_KEY
```

### Making a Chat Completion Request
```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TANVELO_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello from Tanvelo!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'
```

### Python SDK Integration
Tanvelo is a drop-in replacement for any client that uses the OpenAI SDK:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000/v1",
    api_key="YOUR_TANVELO_API_KEY"
)

response = client.chat.completions.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{"role": "user", "content": "Explain quantum computing."}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

---

## Security Architecture & Section 19 Compliance

Per PRD Section 19:
- Dashboard user accounts, login, registration, and OAuth flows are **strictly excluded**.
- Gateway API requests sent by client applications **require API keys**.
- To protect administrative resources, the management dashboard and `/api/*` endpoints are bound to `127.0.0.1` / trusted private network boundaries.
- Only the public unified gateway route (`POST /v1/chat/completions`) should be exposed publicly.
