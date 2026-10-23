export interface TanveloClientOptions {
  /**
   * Tanvelo Gateway API Key (defaults to process.env.TANVELO_API_KEY)
   */
  apiKey?: string;

  /**
   * Tanvelo Gateway Base URL (defaults to process.env.TANVELO_BASE_URL or 'https://tanvelo-backend-zgyc.onrender.com/v1')
   */
  baseUrl?: string;

  /**
   * Timeout in milliseconds for gateway requests (default: 60000ms)
   */
  timeout?: number;

  /**
   * Custom headers to send with requests
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch implementation
   */
  fetch?: typeof globalThis.fetch;
}

export type ChatRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

export interface ChatCompletionCreateParams {
  /**
   * Target upstream provider.
   * Examples: 'anthropic', 'openai', 'google', 'deepseek', 'groq', 'mistral'
   */
  provider?: string;

  /**
   * Target provider or model identifier.
   * Examples: 'anthropic', 'openai', 'google', 'deepseek', 'groq'
   */
  model?: string;

  /**
   * Array of chat messages
   */
  messages: ChatMessage[];

  /**
   * Sampling temperature between 0 and 2
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  max_tokens?: number;

  /**
   * Nucleus sampling parameter
   */
  top_p?: number;

  /**
   * Whether to stream back partial chunks via Server-Sent Events (SSE)
   */
  stream?: boolean;

  /**
   * Stop sequence(s)
   */
  stop?: string | string[];

  /**
   * Optional ordered list of fallback providers to try if the primary fails.
   * e.g. ['google', 'deepseek', 'openai']
   */
  fallbacks?: string[];

  /**
   * Additional vendor-specific pass-through parameters
   */
  [key: string]: any;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: ChatRole;
    content: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
  system_fingerprint?: string;

  /**
   * Tanvelo Metadata headers attached to the response
   */
  _tanvelo?: {
    requestId?: string;
    provider?: string;
    model?: string;
    latencyMs?: number;
    costEstimate?: number;
  };
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: {
    role?: ChatRole;
    content?: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export class TanveloError extends Error {
  public statusCode?: number;
  public responseBody?: any;
  public requestId?: string;
  public type?: string;
  public code?: string;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      responseBody?: any;
      requestId?: string;
      type?: string;
      code?: string;
    }
  ) {
    super(message);
    this.name = 'TanveloError';
    this.statusCode = options?.statusCode;
    this.responseBody = options?.responseBody;
    this.requestId = options?.requestId;
    this.type = options?.type;
    this.code = options?.code;
  }
}
