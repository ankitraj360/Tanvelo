import { ProviderAdapter } from './types.js';
import { OpenAIAdapter } from './openai.adapter.js';
import { AnthropicAdapter } from './anthropic.adapter.js';
import { GeminiAdapter } from './gemini.adapter.js';
import { OpenAICompatibleAdapter, KNOWN_PROVIDER_BASE_URLS } from './openai-compatible.adapter.js';

export * from './types.js';
export * from './openai.adapter.js';
export * from './anthropic.adapter.js';
export * from './gemini.adapter.js';
export * from './openai-compatible.adapter.js';

const staticAdapters: Record<string, ProviderAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  groq: new OpenAICompatibleAdapter('groq'),
  deepseek: new OpenAICompatibleAdapter('deepseek'),
  mistral: new OpenAICompatibleAdapter('mistral'),
  openrouter: new OpenAICompatibleAdapter('openrouter'),
  cohere: new OpenAICompatibleAdapter('cohere'),
  ollama: new OpenAICompatibleAdapter('ollama'),
};

const ALIASES: Record<string, string> = {
  claude: 'anthropic',
  anthropic: 'anthropic',
  google: 'gemini',
  'google-gemini': 'gemini',
  gemini: 'gemini',
  vllm: 'openai',
  local: 'ollama',
  lmstudio: 'ollama',
  together: 'openrouter',
  togetherai: 'openrouter',
};

export function getProviderAdapter(providerName: string, customBaseUrl?: string | null): ProviderAdapter {
  const normalized = providerName.toLowerCase().trim();
  const resolved = ALIASES[normalized] || normalized;

  if (staticAdapters[resolved]) {
    return staticAdapters[resolved];
  }

  // Fallback for custom OpenAI-compatible providers
  return new OpenAICompatibleAdapter(providerName, customBaseUrl || undefined);
}
