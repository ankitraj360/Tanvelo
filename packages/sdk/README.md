# Tanvelo SDK

Official client libraries for **Tanvelo LLM Federation Gateway**. Call any LLM provider (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral, Ollama, vLLM, OpenRouter, and custom endpoints) through one unified script.

---

## 📦 TypeScript & Node.js SDK

### Installation

```bash
# Install Tanvelo:
npm install tanvelo
# or:
npm install tanvelo-sdk
# or directly from GitHub:
npm install git+https://github.com/ankitraj360/Tanvelo.git#subdirectory=packages/sdk
# or use the official OpenAI SDK drop-in:
npm install openai
```

### Quickstart

```typescript
import { Tanvelo } from 'tanvelo';

// Automatically connects to production Tanvelo Gateway (https://tanvelo-backend-zgyc.onrender.com/v1)
const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // or 'tv_live_...'
});

async function main() {
  // Call any model through Tanvelo
  const response = await tanvelo.chat.completions.create({
    model: 'your-model',
    messages: [
      { role: 'system', content: 'You are an expert AI assistant.' },
      { role: 'user', content: 'Write a quick introduction to Tanvelo.' },
    ],
    temperature: 0.7,
  });

  console.log(response.choices[0].message.content);
  console.log('Provider used:', response._tanvelo?.provider);
  console.log('Latency (ms):', response._tanvelo?.latencyMs);
}

main();
```

### Real-Time Streaming

```typescript
const stream = await tanvelo.chat.completions.create({
  model: 'your-model',
  messages: [{ role: 'user', content: 'Explain quantum computing in 3 sentences.' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Automatic Multi-Provider Fallbacks

If your primary model hits a rate limit or outage, Tanvelo can failover instantly to secondary providers:

```typescript
const response = await tanvelo.chat.completions.create({
  model: 'your-model',
  fallbacks: ['your-fallback-model'],
  messages: [{ role: 'user', content: "Summarize today's financial news." }],
});
```

---

## 🐍 Python SDK

### Installation

```bash
# Standard pip install:
pip install tanvelo
# or directly from GitHub:
pip install git+https://github.com/ankitraj360/Tanvelo.git#subdirectory=packages/sdk/python
# or use the official OpenAI SDK drop-in:
pip install openai
```

### Usage

```python
from tanvelo import Tanvelo

# Automatically connects to production Tanvelo Gateway
client = Tanvelo(
    api_key="YOUR_TANVELO_API_KEY", # or set TANVELO_API_KEY env var
)

# 1. Non-streaming call
response = client.chat.completions.create(
    model="your-model",
    messages=[
        {"role": "user", "content": "Hello Tanvelo!"}
    ]
)

print(response.content)
print("Tokens used:", response.usage.total_tokens)

# 2. Streaming response
for chunk in client.chat.completions.create(
    model="your-model",
    messages=[{"role": "user", "content": "Stream a short haiku."}],
    stream=True
):
    print(chunk.delta, end="", flush=True)

# 3. Model fallbacks
response = client.chat.completions.create(
    model="your-model",
    fallbacks=["your-fallback-model"],
    messages=[{"role": "user", "content": "High availability request."}]
)
```

---

## Supported Providers

| Provider | Integration Type | Description |
|---|---|---|
| **OpenAI** | Native / Direct | Frontier reasoning and high-concurrency endpoints |
| **Anthropic** | Native / Direct | Safety-first reasoning and coding models |
| **Google Gemini** | Native / Direct | High-throughput multimodal intelligence |
| **DeepSeek** | OpenAI-Compatible | Advanced reasoning and high-efficiency intelligence |
| **Groq** | OpenAI-Compatible | Ultra-low latency LPU-accelerated inference |
| **Mistral AI** | OpenAI-Compatible | Frontier European multilingual intelligence |
| **OpenRouter** | OpenAI-Compatible | Aggregated multi-provider gateway network |
| **Ollama / Local** | OpenAI-Compatible | Self-hosted local inference on private infrastructure |
| **Custom / vLLM** | OpenAI-Compatible | Any OpenAI-compatible self-hosted server |

---

## 📚 Full Documentation

For full API endpoint specifications, webhook signature verifications, and deterministic fallback mechanics, see [Official Tanvelo Documentation](../../docs/TANVELO_OFFICIAL_DOCS.md) or visit [https://www.tanvelo.xyz/docs](https://www.tanvelo.xyz/docs).

