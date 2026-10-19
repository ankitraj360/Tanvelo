import { TokenUsage } from '../cost-calculator.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderExecutionResult {
  response: ChatCompletionResponse;
  usage?: TokenUsage;
  latencyMs: number;
  statusCode: number;
}

export interface StreamingExecutionResult {
  stream: ReadableStream<Uint8Array>;
  getUsage: () => TokenUsage | null;
  statusCode: number;
  latencyMs: number;
}

export interface ProviderConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

export interface ProviderAdapter {
  providerName: string;
  execute(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs?: number
  ): Promise<ProviderExecutionResult>;
  executeStream(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs?: number
  ): Promise<StreamingExecutionResult>;
  testConnection(
    apiKey: string,
    baseUrl?: string | null
  ): Promise<ProviderConnectionTestResult>;
}
