import {
  TanveloClientOptions,
  ChatCompletionCreateParams,
  ChatCompletion,
  ChatCompletionChunk,
  TanveloError,
} from './types.js';
import { parseEventStream } from './streaming.js';

export class ChatCompletions {
  constructor(private client: Tanvelo) {}

  /**
   * Send a chat completion request to Tanvelo Gateway.
   * Can route to any provider: OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq, Mistral, Ollama, etc.
   */
  async create(
    params: ChatCompletionCreateParams & { stream: true }
  ): Promise<AsyncGenerator<ChatCompletionChunk, void, unknown>>;
  async create(
    params: ChatCompletionCreateParams & { stream?: false }
  ): Promise<ChatCompletion>;
  async create(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk, void, unknown>>;
  async create(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
    return this.client._executeChatCompletion(params);
  }
}

export class Chat {
  public completions: ChatCompletions;

  constructor(client: Tanvelo) {
    this.completions = new ChatCompletions(client);
  }
}

export class Models {
  constructor(private client: Tanvelo) {}

  async list(): Promise<{ id: string; provider: string; name: string }[]> {
    return this.client._executeListModels();
  }
}

export class Tanvelo {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private customHeaders: Record<string, string>;
  private fetchFn: typeof globalThis.fetch;

  public chat: Chat;
  public models: Models;

  constructor(options: TanveloClientOptions = {}) {
    const envApiKey = typeof process !== 'undefined' ? process.env?.TANVELO_API_KEY : undefined;
    const envBaseUrl = typeof process !== 'undefined' ? process.env?.TANVELO_BASE_URL : undefined;

    this.apiKey = options.apiKey || envApiKey || '';
    this.baseUrl = (options.baseUrl || envBaseUrl || 'http://localhost:4000/v1').replace(/\/+$/, '');
    this.timeout = options.timeout || 60000;
    this.customHeaders = options.headers || {};
    this.fetchFn = options.fetch || globalThis.fetch.bind(globalThis);

    this.chat = new Chat(this);
    this.models = new Models(this);
  }

  /**
   * Internal request executor for chat completions
   */
  public async _executeChatCompletion(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
    const url = `${this.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.customHeaders,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (params.fallbacks && params.fallbacks.length > 0) {
      headers['X-Tanvelo-Fallbacks'] = params.fallbacks.join(',');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errBody: any = null;
        try {
          errBody = await response.json();
        } catch {
          errBody = await response.text();
        }

        const message =
          (typeof errBody === 'object' && (errBody?.error?.message || errBody?.error || errBody?.message)) ||
          `Tanvelo Gateway returned HTTP ${response.status}: ${response.statusText}`;

        throw new TanveloError(message, {
          statusCode: response.status,
          responseBody: errBody,
          requestId: response.headers.get('x-tanvelo-request-id') || undefined,
        });
      }

      if (params.stream) {
        return parseEventStream(response);
      }

      const json = await response.json();

      // Attach Tanvelo telemetry metadata
      json._tanvelo = {
        requestId: response.headers.get('x-tanvelo-request-id') || undefined,
        provider: response.headers.get('x-tanvelo-provider') || undefined,
        model: response.headers.get('x-tanvelo-model') || undefined,
        latencyMs: Number(response.headers.get('x-tanvelo-latency-ms')) || undefined,
        costEstimate: Number(response.headers.get('x-tanvelo-cost-usd')) || undefined,
      };

      return json as ChatCompletion;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof TanveloError) throw err;
      if (err?.name === 'AbortError') {
        throw new TanveloError(`Tanvelo Gateway request timed out after ${this.timeout}ms`, {
          statusCode: 408,
        });
      }
      throw new TanveloError(err?.message || 'Failed to connect to Tanvelo Gateway', {
        statusCode: 500,
      });
    }
  }

  /**
   * Internal executor for listing models
   */
  public async _executeListModels(): Promise<{ id: string; provider: string; name: string }[]> {
    const url = `${this.baseUrl}/models`;
    const headers: Record<string, string> = {
      ...this.customHeaders,
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await this.fetchFn(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Health ping to gateway
   */
  public async health(): Promise<{ status: string; uptime?: number }> {
    try {
      const rootUrl = this.baseUrl.replace(/\/v1$/, '');
      const res = await this.fetchFn(`${rootUrl}/health`);
      if (res.ok) {
        return await res.json();
      }
      return { status: 'unhealthy' };
    } catch {
      return { status: 'offline' };
    }
  }
}
