import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
  ProviderConnectionTestResult,
  ProviderExecutionResult,
  StreamingExecutionResult,
} from './types.js';
import { ErrorCategory, GatewayError, categorizeProviderError } from '../errors.js';
import { TokenUsage } from '../cost-calculator.js';

export class OpenAIAdapter implements ProviderAdapter {
  providerName = 'openai';

  async execute(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs: number = 30000
  ): Promise<ProviderExecutionResult> {
    const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timer);

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error?.message || `OpenAI returned status ${res.status}`;
        const category = categorizeProviderError(res.status, errorMsg);
        throw new GatewayError(errorMsg, category, res.status, undefined, data);
      }

      const usage: TokenUsage | undefined = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined;

      return {
        response: data as ChatCompletionResponse,
        usage,
        latencyMs,
        statusCode: res.status,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof GatewayError) throw err;
      const isTimeout = err.name === 'AbortError';
      const category = isTimeout ? ErrorCategory.TIMEOUT : ErrorCategory.NETWORK_ERROR;
      throw new GatewayError(
        isTimeout ? `OpenAI request timed out after ${timeoutMs}ms` : `OpenAI network error: ${err.message}`,
        category,
        isTimeout ? 504 : 502,
        undefined,
        err
      );
    }
  }

  async executeStream(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs: number = 60000
  ): Promise<StreamingExecutionResult> {
    const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...request,
          stream: true,
          stream_options: { include_usage: true },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data?.error?.message || `OpenAI returned status ${res.status}`;
        const category = categorizeProviderError(res.status, errorMsg);
        throw new GatewayError(errorMsg, category, res.status, undefined, data);
      }

      let capturedUsage: TokenUsage | null = null;
      const reader = res.body?.getReader();
      if (!reader) {
        throw new GatewayError('No response body returned from OpenAI', ErrorCategory.INTERNAL_GATEWAY_ERROR, 502);
      }

      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          // Parse chunk to capture token usage if provided
          try {
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                const json = JSON.parse(line.slice(6));
                if (json.usage) {
                  capturedUsage = {
                    promptTokens: json.usage.prompt_tokens,
                    completionTokens: json.usage.completion_tokens,
                    totalTokens: json.usage.total_tokens,
                  };
                }
              }
            }
          } catch (_) {
            // pass
          }

          controller.enqueue(value);
        },
        cancel() {
          reader.cancel();
        },
      });

      return {
        stream,
        getUsage: () => capturedUsage,
        statusCode: res.status,
        latencyMs,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof GatewayError) throw err;
      const isTimeout = err.name === 'AbortError';
      throw new GatewayError(
        isTimeout ? `OpenAI streaming timed out after ${timeoutMs}ms` : `OpenAI network error: ${err.message}`,
        isTimeout ? ErrorCategory.TIMEOUT : ErrorCategory.NETWORK_ERROR,
        isTimeout ? 504 : 502,
        undefined,
        err
      );
    }
  }

  async testConnection(
    apiKey: string,
    baseUrl?: string | null
  ): Promise<ProviderConnectionTestResult> {
    const url = `${baseUrl || 'https://api.openai.com/v1'}/models`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          success: true,
          message: 'Connection verified successfully. OpenAI API key is valid.',
          latencyMs,
        };
      }
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err?.error?.message || `Authentication failed: HTTP ${res.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network failure connecting to OpenAI: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
