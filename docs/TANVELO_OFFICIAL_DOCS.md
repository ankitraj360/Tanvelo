# Tanvelo LLM Federation Gateway & Official SDK Documentation

Welcome to the official developer documentation for **Tanvelo** — the unified LLM API gateway and control plane designed for mission-critical artificial intelligence applications.

---

## Table of Contents

1. [Architecture & Gateway Overview](#1-architecture--gateway-overview)
2. [Quickstart in 60 Seconds](#2-quickstart-in-60-seconds)
3. [Official TypeScript & Node.js SDK (`tanvelo`)](#3-official-typescript--nodejs-sdk-tanvelo)
4. [Official Python SDK (`tanvelo`)](#4-official-python-sdk-tanvelo)
5. [Direct HTTP / REST API Reference](#5-direct-http--rest-api-reference)
6. [Deterministic Fallbacks & Circuit Breakers](#6-deterministic-fallbacks--circuit-breakers)
7. [Distributed Rate Limiting & Spend Caps](#7-distributed-rate-limiting--spend-caps)
8. [Webhook Signature Verification (HMAC-SHA256)](#8-webhook-signature-verification-hmac-sha256)
9. [HTTP Status Codes & Error Payloads](#9-http-status-codes--error-payloads)
10. [FAQ & Production Best Practices](#10-faq--production-best-practices)

---

## 1. Architecture & Gateway Overview

Tanvelo acts as an intelligent, high-performance gateway between your applications (autonomous agents, mobile apps, web servers, microservices) and upstream LLM providers (Anthropic Claude, Google Gemini, DeepSeek, OpenAI, Groq, Mistral, and local Ollama or vLLM deployments).

```
┌────────────────────────────────┐
│   Your Application / Agent     │
└───────────────┬────────────────┘
                │ Official Tanvelo SDK (TS/Python) or REST
                ▼
┌────────────────────────────────────────────────────────┐
│               Tanvelo Gateway Engine                   │
│  ├─ Bearer Key Authentication (SHA-256 Hashes)         │
│  ├─ Redis Token-Bucket Rate Limiter (RPM / TPM)        │
│  ├─ Hard Monthly Budget Spend Enforcer                 │
│  ├─ Sub-180ms Deterministic Circuit Breaker & Fallback │
│  └─ Request Audit Ledger & Dollar-accurate Cost Meter  │
└───────┬──────────────┬──────────────┬───────────┬──────┘
        │              │              │           │
        ▼              ▼              ▼           ▼
   ┌─────────┐   ┌───────────┐   ┌──────────┐  ┌──────────────┐
   │Anthropic│   │  Google   │   │ DeepSeek │  │ Local Ollama │
   │ Claude  │   │  Gemini   │   │  R1 / V3 │  │   / vLLM     │
   └─────────┘   └───────────┘   └──────────┘  └──────────────┘
```

### Production Endpoints

| Environment | Base Gateway URL |
|---|---|
| **Production Cloud Gateway** | `https://tanvelo-backend-zgyc.onrender.com/v1` |
| **Local Development Gateway** | `http://127.0.0.1:4001/v1` |

---

## 2. Quickstart in 60 Seconds

1. **Create an API Key**: Sign in to the Tanvelo Console, navigate to **API Keys**, and generate a key (`tv_live_...`).
2. **Configure Upstream Providers**: In the **Providers** tab, input API keys for Anthropic, Google Gemini, OpenAI, or DeepSeek. Keys are AES-256-GCM encrypted.
3. **Install the Official SDK**:
   - TypeScript: `npm install tanvelo` (or `npm install @tanvelo/sdk`)
   - Python: `pip install tanvelo`
4. **Make Your First Call**: Execute a completion with automatic multi-provider fallback.

---

## 3. Official TypeScript & Node.js SDK (`tanvelo`)

The official TypeScript SDK provides a zero-dependency, type-safe client with native support for Server-Sent Events (SSE) streaming and Tanvelo's multi-provider fallback engine.

### Installation

```bash
npm install tanvelo
# or using pnpm
pnpm add tanvelo
# or using yarn
yarn add tanvelo
```

### Basic Chat Completion

```typescript
import { Tanvelo } from 'tanvelo';

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // format: "tv_live_..."
});

async function main() {
  const response = await tanvelo.chat.completions.create({
    model: 'claude-3-5-sonnet',
    messages: [
      { role: 'system', content: 'You are a concise production AI engineer.' },
      { role: 'user', content: 'Explain deterministic circuit breakers in distributed systems.' },
    ],
    temperature: 0.7,
  });

  // Extract primary message text
  console.log(response.choices[0].message.content);

  // Inspect Tanvelo-specific telemetry headers
  console.log('Provider used:', response._tanvelo?.provider);
  console.log('Upstream latency:', response._tanvelo?.latencyMs, 'ms');
  console.log('Estimated cost:', response._tanvelo?.costUsd, 'USD');
  console.log('Request ID:', response._tanvelo?.requestId);
}

main();
```

### Real-Time Streaming with Multi-Provider Fallbacks

If the primary provider hits a 429 rate limit or unexpected 5xx outage, Tanvelo immediately and transparently fails over to your ordered fallback targets:

```typescript
import { Tanvelo } from 'tanvelo';

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY,
});

async function streamResponse() {
  const stream = await tanvelo.chat.completions.create({
    model: 'gpt-4o',
    fallbacks: ['claude-3-5-sonnet', 'gemini-1.5-pro', 'deepseek-chat'],
    messages: [
      { role: 'user', content: 'Write a comprehensive high-availability checklist.' },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(text);
  }
}

streamResponse();
```

### TypeScript Configuration Options

```typescript
const tanvelo = new Tanvelo({
  apiKey: 'tv_live_...',        // Your Tanvelo gateway API key
  baseUrl: 'https://...',       // Optional: Custom gateway URL (defaults to production)
  timeout: 30000,               // Optional: Timeout in ms (defaults to 30,000)
  maxRetries: 2,                // Optional: Gateway connection retries
});
```

---

## 4. Official Python SDK (`tanvelo`)

The official Python client requires zero external dependencies, leveraging Python's standard library `urllib` to minimize packaging overhead.

### Installation

```bash
pip install tanvelo
```

### Standard Completion

```python
from tanvelo import Tanvelo

# Automatically detects TANVELO_API_KEY environment variable if omitted
client = Tanvelo(api_key="tv_live_...")

response = client.chat.completions.create(
    model="claude-3-5-sonnet",
    fallbacks=["gemini-1.5-pro", "deepseek-chat"],
    messages=[
        {"role": "system", "content": "You are a senior systems architect."},
        {"role": "user", "content": "How do distributed rate limiters handle clock drift?"}
    ],
    temperature=0.5
)

# Helper property to extract text directly
print(response.content)

# Inspect gateway telemetry
print(f"Fulfilled by: {response.headers.get('x-tanvelo-provider')}")
print(f"Latency: {response.headers.get('x-tanvelo-latency-ms')} ms")
print(f"Request ID: {response.headers.get('x-tanvelo-request-id')}")
```

### Real-Time Streaming in Python

```python
from tanvelo import Tanvelo

client = Tanvelo()

stream = client.chat.completions.create(
    model="gemini-1.5-flash",
    fallbacks=["claude-3-haiku", "gpt-4o-mini"],
    messages=[{"role": "user", "content": "List 5 principles of distributed microservices."}],
    stream=True
)

for chunk in stream:
    print(chunk.delta, end="", flush=True)
print()
```

### Exception Handling in Python

```python
from tanvelo import Tanvelo, TanveloError

client = Tanvelo()

try:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Test"}]
    )
except TanveloError as e:
    print(f"Gateway error occurred: {e}")
    print(f"HTTP Status: {e.status_code}")
    print(f"Response Payload: {e.response_body}")
```

---

## 5. Direct HTTP / REST API Reference

For languages without a dedicated SDK (Go, Rust, Ruby, Elixir, PHP, Java, cURL), connect directly to the standard REST endpoint:

### Endpoint

```http
POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions
```

### Request Headers

| Header | Type | Description |
|---|---|---|
| `Authorization` | string | `Bearer <YOUR_TANVELO_API_KEY>` (e.g. `tv_live_...`) |
| `Content-Type` | string | `application/json` |
| `X-Tanvelo-Fallbacks` | string | *(Optional)* Comma-separated list of fallback models (e.g., `claude-3-5-sonnet,gemini-1.5-pro`) |

### Request Body Parameters

```json
{
  "model": "claude-3-5-sonnet",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Summarize distributed systems." }
  ],
  "fallbacks": ["gemini-1.5-pro", "gpt-4o"],
  "temperature": 0.7,
  "max_tokens": 1024,
  "stream": false
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `model` | string | Yes | Primary model identifier (e.g., `claude-3-5-sonnet`, `gemini-1.5-pro`, `deepseek-chat`, `gpt-4o`) |
| `messages` | array | Yes | Array of conversation messages with `role` and `content` |
| `fallbacks` | array | No | Ordered list of models to execute if primary model fails |
| `temperature` | number | No | Sampling temperature between `0.0` and `2.0` |
| `max_tokens` | integer | No | Maximum tokens to generate |
| `stream` | boolean | No | If `true`, response is streamed as Server-Sent Events (`text/event-stream`) |

### Response Headers Emitted by Tanvelo

| Header | Description |
|---|---|
| `X-Tanvelo-Request-Id` | Unique UUID assigned to the request for audit logs |
| `X-Tanvelo-Provider` | Upstream provider that fulfilled the response (`anthropic`, `gemini`, `deepseek`, etc.) |
| `X-Tanvelo-Model` | Exact model name executed |
| `X-Tanvelo-Latency-Ms` | Total duration from request ingress to completion |
| `X-Tanvelo-Cost-Usd` | Computed cost based on input/output token pricing |
| `X-RateLimit-Limit` | Maximum allowed requests per window |
| `X-RateLimit-Remaining` | Remaining requests allowed before 429 cutoff |
| `X-RateLimit-Reset` | Seconds until rate limit window resets |

### Example cURL Request

```bash
curl -X POST https://tanvelo-backend-zgyc.onrender.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TANVELO_API_KEY" \
  -d '{
    "model": "claude-3-5-sonnet",
    "fallbacks": ["gemini-1.5-pro"],
    "messages": [
      {"role": "user", "content": "What is Tanvelo Gateway?"}
    ]
  }'
```

---

## 6. Deterministic Fallbacks & Circuit Breakers

When building with multi-tenant LLM APIs, outages and rate limits are inevitable:
- **Upstream Rate Limits (HTTP 429)**: Providers enforce dynamic TPM and RPM quotas.
- **Provider Outages (HTTP 500, 502, 503, 504)**: High load or internal provider downtime.
- **Connection Timeouts**: Models hanging on complex prompts.

### How Tanvelo Solves This

When Tanvelo detects an upstream failure, its circuit breaker kicks in:
1. It records the failure in the audit ledger.
2. It immediately shifts the request to the next model in your `fallbacks` list in **under 180 milliseconds**.
3. It retains the client connection and streams back the fallback response without breaking client logic.

```
Client Request -> [ gpt-4o ] --(429 Too Many Requests)--> Failover (142ms) -> [ claude-3-5-sonnet ] -> Success
```

---

## 7. Distributed Rate Limiting & Spend Caps

### Token-Bucket Limiter (Redis-Backed)
Tanvelo enforces atomic token-bucket algorithms in Redis:
- **RPM (Requests Per Minute)**
- **TPM (Tokens Per Minute)**
- **RPH / RPD (Requests Per Hour / Day)**

When a key or project exceeds limits, Tanvelo immediately returns an HTTP `429 Too Many Requests` with a `Retry-After: <seconds>` header, preventing upstream bill shock.

### Hard Monthly Spend Safeguards
Autonomous agents can enter recursive loops and drain thousands of dollars. Tanvelo allows configuring hard spending caps:
- **Warning Threshold**: Sends a webhook alert at 80% (or custom) threshold.
- **Hard Limit**: Automatically blocks all new requests once monthly budget ceiling is reached.

---

## 8. Webhook Signature Verification (HMAC-SHA256)

Tanvelo delivers asynchronous webhook events (`request.completed`, `request.failed`, `budget.warning`, `budget.exceeded`) to your configured URLs.

Each webhook delivery contains a signature header:
```
Tanvelo-Signature: t=1729678800,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

### Verification Example (Node.js)

```javascript
import crypto from 'crypto';

export function verifyTanveloWebhook(payloadRaw, signatureHeader, secret) {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('='))
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  // Protect against replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadRaw}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### Verification Example (Python)

```python
import hmac
import hashlib
import time

def verify_tanvelo_webhook(payload_raw: bytes, signature_header: str, secret: str) -> bool:
    parts = dict(item.split("=") for item in signature_header.split(","))
    timestamp = parts.get("t")
    signature = parts.get("v1")

    if not timestamp or not signature:
        return False

    # Prevent replay attacks
    if abs(time.time() - int(timestamp)) > 300:
        return False

    signed_payload = f"{timestamp}.".encode("utf-8") + payload_raw
    expected = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()

    return hmac.compare_digest(signature, expected)
```

---

## 9. HTTP Status Codes & Error Payloads

All error responses from Tanvelo adhere to the standard JSON error schema:

```json
{
  "error": {
    "message": "Project monthly budget cap ($100.00) has been exceeded.",
    "type": "budget_exceeded",
    "code": "budget_limit_reached"
  }
}
```

| HTTP Code | Error Type | Cause | Resolution |
|---|---|---|---|
| `400 Bad Request` | `invalid_request_error` | Missing required fields (`model`, `messages`) or invalid JSON | Validate request payload structure |
| `401 Unauthorized` | `authentication_error` | Invalid or revoked Tanvelo API Key | Verify key starting with `tv_live_` in header |
| `403 Forbidden` | `permission_denied` | Key lacks access to requested environment or model | Check API key permissions in console |
| `429 Too Many Requests` | `rate_limit_exceeded` / `budget_exceeded` | Rate limit window exceeded or monthly spend cap reached | Inspect `Retry-After` header or adjust budgets |
| `502 Bad Gateway` | `upstream_provider_error` | Primary provider failed and no valid fallbacks configured | Configure secondary fallback models in request |
| `503 Service Unavailable` | `provider_unavailable` | No upstream provider credentials configured | Add provider API keys in Providers tab |

---

## 10. FAQ & Production Best Practices

### Q: Does Tanvelo store prompt content or responses?
**A:** No. By default, Tanvelo operates with **Zero Body Retention**. Payloads are streamed in-flight and discarded immediately. Only auditable metadata (token count, latency, status code, estimated cost) is logged.

### Q: How do I rotate API keys without downtime?
**A:** Create a new API key in the Tanvelo Console, update your application's environment variable, verify traffic is flowing, and then revoke the deprecated key.

### Q: Can I run Tanvelo with local Ollama or vLLM instances?
**A:** Yes. In the **Providers** tab, add a custom provider with your local or private endpoint (e.g. `http://localhost:11434/v1` or private VPC IP). Tanvelo will route queries seamlessly between local models and public clouds.

---

### Need Help or Have Enterprise Requirements?
- **Email**: [tanvelo@zohomail.in](mailto:tanvelo@zohomail.in)
- **X (formerly Twitter)**: [@tanvelo_in](https://x.com/tanvelo_in)
- **Instagram**: [@tanvelo_in](https://instagram.com/tanvelo_in)
- **Web Console**: [https://www.tanvelo.in](https://www.tanvelo.in)
