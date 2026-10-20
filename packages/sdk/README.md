# Tanvelo SDK

Official client libraries for **Tanvelo LLM Federation Gateway**. Call any LLM provider (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral, Ollama, vLLM, OpenRouter, and custom endpoints) through one unified script.

---

## 📦 TypeScript & Node.js SDK

### Installation

```bash
npm install @tanvelo/sdk
# or
pnpm add @tanvelo/sdk
# or
yarn add @tanvelo/sdk
```

### Quickstart

```typescript
import { Tanvelo } from '@tanvelo/sdk';

const tanvelo = new Tanvelo({
  apiKey: process.env.TANVELO_API_KEY, // or pass directly
  baseUrl: 'http://localhost:4000/v1', // Tanvelo gateway URL
});

async function main() {
  // Call any provider by model name or provider prefix
  const response = await tanvelo.chat.completions.create({
    model: 'gpt-4o', // or 'claude-3-5-sonnet', 'gemini-1.5-pro', 'deepseek/deepseek-chat'
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
  model: 'claude-3-5-sonnet',
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
  model: 'gpt-4o',
  fallbacks: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
  messages: [{ role: 'user', content: 'Summarize today\'s financial news.' }],
});
```

---

## 🐍 Python SDK

### Usage

```python
from tanvelo import Tanvelo

client = Tanvelo(
    api_key="YOUR_TANVELO_API_KEY",
    base_url="http://localhost:4000/v1"
)

# 1. Non-streaming call
response = client.chat.completions.create(
    model="gpt-4o",  # or "claude-3-5-sonnet", "gemini-1.5-pro", "deepseek-chat"
    messages=[
        {"role": "user", "content": "Hello Tanvelo!"}
    ]
)

print(response.content)
print("Tokens used:", response.usage.total_tokens)

# 2. Streaming response
for chunk in client.chat.completions.create(
    model="claude-3-5-sonnet",
    messages=[{"role": "user", "content": "Stream a short haiku."}],
    stream=True
):
    print(chunk.delta, end="", flush=True)

# 3. Model fallbacks
response = client.chat.completions.create(
    model="gpt-4o",
    fallbacks=["claude-3-5-sonnet", "gemini-1.5-pro"],
    messages=[{"role": "user", "content": "High availability request."}]
)
```

---

## Supported Providers

| Provider | Model Examples |
|---|---|
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini` |
| **Anthropic Claude** | `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus` |
| **Google Gemini** | `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash` |
| **DeepSeek** | `deepseek-chat`, `deepseek-reasoner` |
| **Groq** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768` |
| **Mistral AI** | `mistral-large-latest`, `codestral-latest` |
| **OpenRouter** | `openrouter/anthropic/claude-3.5-sonnet` |
| **Ollama / Local** | `ollama/llama3.1`, `ollama/mistral`, `ollama/qwen2.5-coder` |
| **Custom / vLLM** | Any OpenAI-compatible self-hosted inference server |
