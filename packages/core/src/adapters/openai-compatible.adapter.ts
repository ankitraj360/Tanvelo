import { OpenAIAdapter } from './openai.adapter.js';
import {
  ChatCompletionRequest,
  ProviderAdapter,
  ProviderConnectionTestResult,
  ProviderExecutionResult,
  StreamingExecutionResult,
} from './types.js';

export const KNOWN_PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com',
  mistral: 'https://api.mistral.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  cohere: 'https://api.cohere.com/compatibility/v1',
  ollama: 'http://localhost:11434/v1',
  together: 'https://api.together.xyz/v1',
  togetherai: 'https://api.together.xyz/v1',
  lmstudio: 'http://localhost:1234/v1',
  vllm: 'http://localhost:8000/v1',
};

export class OpenAICompatibleAdapter implements ProviderAdapter {
  providerName: string;
  private defaultBaseUrl: string;
  private innerAdapter: OpenAIAdapter;

  constructor(providerName: string, defaultBaseUrl?: string) {
    this.providerName = providerName.toLowerCase();
    this.defaultBaseUrl = defaultBaseUrl || KNOWN_PROVIDER_BASE_URLS[this.providerName] || 'https://api.openai.com/v1';
    this.innerAdapter = new OpenAIAdapter();
  }

  async execute(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs?: number
  ): Promise<ProviderExecutionResult> {
    const effectiveBaseUrl = baseUrl || this.defaultBaseUrl;
    const key = apiKey || (this.providerName === 'ollama' ? 'ollama' : apiKey);
    return this.innerAdapter.execute(request, key, effectiveBaseUrl, timeoutMs);
  }

  async executeStream(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs?: number
  ): Promise<StreamingExecutionResult> {
    const effectiveBaseUrl = baseUrl || this.defaultBaseUrl;
    const key = apiKey || (this.providerName === 'ollama' ? 'ollama' : apiKey);
    return this.innerAdapter.executeStream(request, key, effectiveBaseUrl, timeoutMs);
  }

  async testConnection(
    apiKey: string,
    baseUrl?: string | null
  ): Promise<ProviderConnectionTestResult> {
    const effectiveBaseUrl = baseUrl || this.defaultBaseUrl;
    const key = apiKey || (this.providerName === 'ollama' ? 'ollama' : apiKey);
    const start = Date.now();

    try {
      const url = `${effectiveBaseUrl.replace(/\/+$/, '')}/models`;
      const res = await fetch(url, {
        method: 'GET',
        headers: key ? { Authorization: `Bearer ${key}` } : {},
      });

      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          success: true,
          message: `Connection verified successfully with ${this.providerName.toUpperCase()} API.`,
          latencyMs,
        };
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
