import { ProviderAdapter } from './types.js';
import { OpenAIAdapter } from './openai.adapter.js';
import { AnthropicAdapter } from './anthropic.adapter.js';
import { GeminiAdapter } from './gemini.adapter.js';
import { OpenAICompatibleAdapter } from './openai-compatible.adapter.js';
import {
  PROVIDER_ALIASES,
  KNOWN_PROVIDER_BASE_URLS,
  findProvider,
} from '../providers/catalog.js';

export * from './types.js';
export * from './openai.adapter.js';
export * from './anthropic.adapter.js';
export * from './gemini.adapter.js';
export * from './openai-compatible.adapter.js';
export * from '../providers/catalog.js';

const defaultOpenAIAdapter = new OpenAIAdapter();
const defaultAnthropicAdapter = new AnthropicAdapter();
const defaultGeminiAdapter = new GeminiAdapter();

const adapterCache = new Map<string, ProviderAdapter>();

export function getProviderAdapter(providerName: string, customBaseUrl?: string | null): ProviderAdapter {
  const normalized = (providerName || '').toLowerCase().trim();
  const canonical = PROVIDER_ALIASES[normalized] || normalized;

  // 1. Anthropic / Claude
  if (canonical === 'anthropic' || canonical === 'claude') {
    return defaultAnthropicAdapter;
  }

  // 2. Google Gemini
  if (canonical === 'gemini' || canonical === 'google') {
    return defaultGeminiAdapter;
  }

  // 3. OpenAI (standard cloud endpoint without customBaseUrl)
  if (canonical === 'openai' && !customBaseUrl) {
    return defaultOpenAIAdapter;
  }

  // 4. If custom base URL is supplied, always instantiate an OpenAICompatibleAdapter for that specific endpoint
  if (customBaseUrl) {
    return new OpenAICompatibleAdapter(normalized, customBaseUrl);
  }

  // 5. Look in cache for zero-allocation performance on default endpoints
  if (adapterCache.has(canonical)) {
    return adapterCache.get(canonical)!;
  }

  // 6. Look up in 140+ provider catalog
  const catalogEntry = findProvider(normalized) || findProvider(canonical);
  const effectiveBaseUrl = catalogEntry?.baseUrl || KNOWN_PROVIDER_BASE_URLS[normalized] || KNOWN_PROVIDER_BASE_URLS[canonical];

  const adapter = new OpenAICompatibleAdapter(normalized, effectiveBaseUrl);
  adapterCache.set(canonical, adapter);
  return adapter;
}
