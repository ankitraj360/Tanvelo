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
    this.baseUrl = (
      options.baseUrl ||
      envBaseUrl ||
      'https://tanvelo-backend-zgyc.onrender.com/v1'
    ).replace(/\/+$/, '');
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

    const payload = {
      ...params,
      model: params.model || params.provider || 'your-model',
    };

    try {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
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
  public async _executeListModels(): Promise<{ id: string; provider: string; name: string; object?: string; created?: number; owned_by?: string }[]> {
    const url = `${this.baseUrl}/models`;
    const headers: Record<string, string> = {
      ...this.customHeaders,
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await this.fetchFn(url, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new TanveloError(
          errData?.error?.message || errData?.message || `Failed to list models: HTTP ${res.status}`,
          {
            statusCode: res.status,
            type: errData?.error?.type || 'api_error',
            code: errData?.error?.code || 'models_list_failed',
          }
        );
      }

      const data = await res.json();
      const items: any[] = data.data || (Array.isArray(data) ? data : []);
      return items.map((m: any) => ({
        id: m.id,
        provider: m.owned_by || m.provider || (typeof m.id === 'string' && m.id.includes('/') ? m.id.split('/')[0] : 'openai'),
        name: m.name || m.id,
        object: m.object,
        created: m.created,
        owned_by: m.owned_by,
      }));
    } catch (err: any) {
      if (err instanceof TanveloError) {
        throw err;
      }
      throw new TanveloError(err?.message || 'Failed to connect to Tanvelo Gateway', {
        statusCode: 500,
      });
    }
  }

  /**
   * Health ping to gateway
   */
  public async health(): Promise<{ status: string; uptime?: number }> {
    try {
      const rootUrl = this.baseUrl.replace(/\/v1\/?$/, '');
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
