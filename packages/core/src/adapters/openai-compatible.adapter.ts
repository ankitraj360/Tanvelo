import { OpenAIAdapter } from './openai.adapter.js';
import {
  ChatCompletionRequest,
  ProviderAdapter,
  ProviderConnectionTestResult,
  ProviderExecutionResult,
  StreamingExecutionResult,
} from './types.js';
import {
  KNOWN_PROVIDER_BASE_URLS,
  PROVIDER_ALIASES,
  findProvider,
} from '../providers/catalog.js';

/**
 * Builds HTTP authorization headers supporting Bearer tokens, custom headers (e.g. "api-key: val"),
 * Azure-specific headers, and unauthenticated local models.
 */
export function buildAuthHeaders(apiKey?: string | null, providerName?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!apiKey || apiKey === 'local' || apiKey === 'none' || apiKey === 'local-key') {
    return headers;
  }

  const trimmed = apiKey.trim();

  // If apiKey starts with "Bearer "
  if (trimmed.startsWith('Bearer ')) {
    headers['Authorization'] = trimmed;
    return headers;
  }

  // If user provided a custom header string like "api-key: xyz" or "x-api-key: xyz"
  if (trimmed.includes(':') && !trimmed.startsWith('http')) {
    const colonIdx = trimmed.indexOf(':');
    const headerName = trimmed.substring(0, colonIdx).trim();
    const headerVal = trimmed.substring(colonIdx + 1).trim();
    headers[headerName] = headerVal;
    return headers;
  }

  // Azure specific handling
  if (providerName && providerName.toLowerCase().includes('azure')) {
    headers['api-key'] = trimmed;
    headers['Authorization'] = `Bearer ${trimmed}`;
    return headers;
  }

  // Standard Bearer token
  headers['Authorization'] = `Bearer ${trimmed}`;
  return headers;
}

export class OpenAICompatibleAdapter implements ProviderAdapter {
  providerName: string;
  private defaultBaseUrl: string;
  private innerAdapter: OpenAIAdapter;

  get baseUrl(): string {
    return this.defaultBaseUrl;
  }

  constructor(providerName: string, defaultBaseUrl?: string) {
    this.providerName = providerName.toLowerCase().trim();
    const resolvedCanonical = PROVIDER_ALIASES[this.providerName] || this.providerName;
    const catalogEntry = findProvider(this.providerName) || findProvider(resolvedCanonical);

    this.defaultBaseUrl =
      defaultBaseUrl ||
      catalogEntry?.baseUrl ||
      KNOWN_PROVIDER_BASE_URLS[this.providerName] ||
      KNOWN_PROVIDER_BASE_URLS[resolvedCanonical] ||
      'https://api.openai.com/v1';

    this.innerAdapter = new OpenAIAdapter();
  }

  async execute(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs?: number
  ): Promise<ProviderExecutionResult> {
    const effectiveBaseUrl = baseUrl || this.defaultBaseUrl;
    const isLocal =
      this.providerName === 'ollama' ||
      this.providerName === 'vllm' ||
      this.providerName === 'lmstudio' ||
      this.providerName === 'local' ||
      effectiveBaseUrl.includes('localhost') ||
      effectiveBaseUrl.includes('127.0.0.1');

    const key = apiKey || (isLocal ? 'local-key' : apiKey);
    return this.innerAdapter.execute(request, key, effectiveBaseUrl, timeoutMs);
  }

  async executeStream(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs?: number
  ): Promise<StreamingExecutionResult> {
    const effectiveBaseUrl = baseUrl || this.defaultBaseUrl;
    const isLocal =
      this.providerName === 'ollama' ||
      this.providerName === 'vllm' ||
      this.providerName === 'lmstudio' ||
      this.providerName === 'local' ||
      effectiveBaseUrl.includes('localhost') ||
      effectiveBaseUrl.includes('127.0.0.1');

    const key = apiKey || (isLocal ? 'local-key' : apiKey);
    return this.innerAdapter.executeStream(request, key, effectiveBaseUrl, timeoutMs);
  }

  async testConnection(
    apiKey: string,
    baseUrl?: string | null
  ): Promise<ProviderConnectionTestResult> {
    const effectiveBaseUrl = (baseUrl || this.defaultBaseUrl).replace(/\/+$/, '');
    const isLocal =
      this.providerName === 'ollama' ||
      this.providerName === 'vllm' ||
      this.providerName === 'lmstudio' ||
      this.providerName === 'local' ||
      effectiveBaseUrl.includes('localhost') ||
      effectiveBaseUrl.includes('127.0.0.1');

    const key = apiKey || (isLocal ? 'local-key' : apiKey);
    const authHeaders = buildAuthHeaders(key, this.providerName);
    const start = Date.now();

    try {
      // Step 1: Probe GET /models
      const modelsUrl = `${effectiveBaseUrl}/models`;
      const res = await fetch(modelsUrl, {
        method: 'GET',
        headers: authHeaders,
      });

      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          success: true,
          message: `Connection verified successfully with ${this.providerName.toUpperCase()} API.`,
          latencyMs,
        };
      }

      // Step 2: If /models returned 404 or 405, many endpoints (custom vLLM, private gateways, local runners)
      // only expose /chat/completions. Send a lightweight completions probe.
      if (res.status === 404 || res.status === 405) {
        try {
          const chatUrl = `${effectiveBaseUrl}/chat/completions`;
          const chatRes = await fetch(chatUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              model: 'tanvelo-probe',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
            }),
          });

          const chatLatency = Date.now() - start;

          // If 200 OK, or 400 Bad Request / 422 Unprocessable (e.g. invalid model name / missing fields),
          // this proves the endpoint is alive and speaking OpenAI protocol.
          if (chatRes.ok || chatRes.status === 400 || chatRes.status === 422) {
            return {
              success: true,
              message: `Endpoint verified successfully via /chat/completions (${this.providerName.toUpperCase()}).`,
              latencyMs: chatLatency,
            };
          }

          if (chatRes.status === 401 || chatRes.status === 403) {
            const err = await chatRes.json().catch(() => ({}));
            return {
              success: false,
              message: err?.error?.message || `Authentication failed with ${this.providerName.toUpperCase()} (HTTP ${chatRes.status})`,
              latencyMs: chatLatency,
            };
          }
        } catch (_) {
          // Fall through to original error
        }
      }

      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || err?.message || `Provider returned HTTP ${res.status}`;
      return {
        success: false,
        message: msg,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network failure connecting to ${effectiveBaseUrl}: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
