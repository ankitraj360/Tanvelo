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
