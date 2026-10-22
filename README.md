# Tanvelo — Production LLM API Gateway

Tanvelo is a production-oriented developer infrastructure SaaS LLM API Gateway that unifies access to OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, Mistral, OpenRouter, Cohere, Ollama, and custom OpenAI-compatible endpoints with deterministic routing, safe fallbacks, distributed rate limiting, token usage tracking, cost estimation, webhooks, and budget enforcement.

---

## Key Capabilities

- **Unified OpenAI-Compatible Gateway**: Exposes `POST /v1/chat/completions` with streaming Server-Sent Events (SSE) support and standardized error formatting.
- **Multi-Provider Support**: Built-in adapters for **OpenAI**, **Anthropic**, **Google Gemini**, **Groq**, **DeepSeek**, **Mistral**, **OpenRouter**, **Cohere**, **Ollama**, and custom endpoints with automatic request translation, response normalization, and live connection verification.
- **Deterministic Routing & Fallback**: Priority-based routing rules with automatic failover to secondary providers/models upon timeouts, rate-limits (HTTP 429), or upstream 5xx outages. Supports per-request overrides via `X-Tanvelo-Fallbacks`.
- **Distributed Rate Limiting**: Redis-backed atomic fixed-window counters (requests per minute, hour, day, and token limits) with standard `X-RateLimit-*` and `Retry-After` headers, and resilient in-memory local fallback.
- **API Key Security & Permissions**: Gateway API keys generated with cryptographically secure randomness; keys displayed once on creation and stored strictly as SHA-256 hashes. Enforces scoped permissions (e.g. `chat:completions`).
- **Provider Key Encryption**: Upstream provider credentials encrypted at rest using server-side **AES-256-GCM** with 64-hex char secret keys.
- **Zero Retention by Default**: By default, Tanvelo does not retain prompt payloads or model generation bodies (`LOG_PAYLOADS=false`). Only metadata, token counts, and latency are stored.
- **Usage Budgets & Hard Cutoffs**: Project and environment budgets with lazy resets (daily/monthly/total), transition-based warning alerts, and atomic hard-limit blocking (`429 budget_exceeded`).
- **Webhooks with Hardened SSRF Protection**: Signed HMAC-SHA256 event notifications (`X-Tanvelo-Signature`) with automatic retries and strict validation blocking loopback, private RFC1918, CGNAT, benchmark, documentation, multicast, IPv4-mapped IPv6, and non-HTTP schemes.
- **16 Complete Dashboard Pages**: Overview, Projects, Project Details, Providers, Models, API Requests, Request Inspector, Errors & Failures, Rate Limits, Analytics, Usage & Budgets, Routing & Fallbacks, API Keys, Webhooks, Developer Documentation, and Settings.

---

## Architecture

Tanvelo is structured as a modular TypeScript monorepo with clean separation between the high-performance gateway request path and the authenticated management dashboard:

```
├── apps/
│   ├── gateway/         # Fastify high-performance engine (:4000) & isolated management listener (:4001)
│   │   ├── src/
│   │   │   ├── routes/  # /v1/chat/completions, /v1/models, /health, /api/*
│   │   │   ├── services/# Gateway execution pipeline & persistence
│   │   │   └── server.ts
│   │   └── test/        # Gateway integration tests
│   └── web/             # Next.js 14 App Router dashboard (:3000)
│       └── src/
│           ├── app/     # 16 complete dashboard pages + authenticated /api/[...path] proxy
│           ├── components/ # Reusable UI components & dark SaaS design system
│           └── context/ # Global project & environment isolation context
├── packages/
│   ├── core/            # Business logic: adapters, routing, crypto, rate limiter, webhooks
│   │   └── test/        # Unit & security tests
│   ├── db/              # Prisma schema, migrations, and PostgreSQL client
│   └── sdk/             # Official TypeScript SDK (@tanvelo/sdk)
├── docker-compose.production.yml # Multi-container production deployment
└── fix-that.md          # Production readiness verification plan
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

### 4. Database Migrations & Seed Catalog
In development:
```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

In production / CI:
```bash
pnpm db:migrate:deploy
```
> **Note:** Production databases use tracked versioned migrations via `pnpm db:migrate:deploy` (`prisma migrate deploy`). `prisma db push` is restricted to disposable local development databases.

### 5. Run the Services
```bash
# Run both Gateway (:4000) and Web Dashboard (:3000) concurrently
pnpm dev

# Or run individually:
pnpm dev:gateway  # Starts Fastify Gateway on http://localhost:4000 and management on 127.0.0.1:4001
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
curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TANVELO_API_KEY" \
  -H "X-Tanvelo-Fallbacks: claude-3-5-sonnet,gemini-1.5-flash" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello from Tanvelo!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'
```

### SDK Installation & Usage

#### TypeScript & Node.js
```bash
npm install @tanvelo/sdk
# or directly from GitHub:
npm install git+https://github.com/ankitraj360/Tanvelo.git#subdirectory=packages/sdk
# or use the official OpenAI SDK drop-in:
npm install openai
```

```typescript
import { Tanvelo } from '@tanvelo/sdk';

const tanvelo = new Tanvelo({ apiKey: process.env.TANVELO_API_KEY });
const res = await tanvelo.chat.completions.create({
  model: 'gpt-4o',
  fallbacks: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
  messages: [{ role: 'user', content: 'Explain federated gateways.' }],
});
console.log(res.choices[0].message.content);
```

#### Python
```bash
pip install tanvelo
# or directly from GitHub:
pip install git+https://github.com/ankitraj360/Tanvelo.git#subdirectory=packages/sdk/python
# or use the official OpenAI SDK drop-in:
pip install openai
```

```python
from tanvelo import Tanvelo

client = Tanvelo(api_key="YOUR_TANVELO_API_KEY")
res = client.chat.completions.create(
    model="gpt-4o",
    fallbacks=["claude-3-5-sonnet", "gemini-1.5-pro"],
    messages=[{"role": "user", "content": "Explain federated gateways."}]
)
print(res.content)
```
  }'
```

### Response Headers
Every gateway response returns rich operational telemetry:
- `X-Tanvelo-Request-Id`: Unique request identifier.
- `X-Tanvelo-Provider`: Actual provider that fulfilled the completion (e.g. `openai`, `anthropic`).
- `X-Tanvelo-Model`: Model used for the generation.
- `X-Tanvelo-Latency-Ms`: Upstream end-to-end latency in milliseconds.
- `X-Tanvelo-Cost-Usd`: Estimated cost in USD based on input/output token usage.
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`: Fixed-window rate limit counters.
- `Retry-After`: Emitted on HTTP 429 when rate limits are exceeded.

---

## Security Architecture & Access Control

- **Dashboard Authentication (Clerk)**: The management dashboard is protected by Clerk authentication. Unauthenticated requests are rejected.
- **Loopback Management Isolation**: The internal management listener (:4001) binds strictly to `127.0.0.1`. Public ingress proxies only port `:4000/v1/*` and `:3000`.
- **Management API Secret Proxy**: Dashboard requests to `/api/*` are verified server-side by Next.js and proxied to `127.0.0.1:4001` with `X-Management-Secret`. Direct unauthenticated requests to 4001 return `401`.
- **Strict Startup Validation**: In production, startup immediately fails if `MANAGEMENT_API_SECRET` is shorter than 32 characters or if `ENCRYPTION_SECRET` is not a 64-character hex string.

