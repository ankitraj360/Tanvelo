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

export class AnthropicAdapter implements ProviderAdapter {
  providerName = 'anthropic';

  private translateMessages(request: ChatCompletionRequest): {
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | undefined;
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        system = system ? `${system}\n${msg.content}` : msg.content;
      } else {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'Hello' });
    }

    return { system, messages };
  }

  async execute(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs: number = 30000
  ): Promise<ProviderExecutionResult> {
    const url = `${baseUrl || 'https://api.anthropic.com/v1'}/messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const { system, messages } = this.translateMessages(request);
    const body: Record<string, any> = {
      model: request.model,
      max_tokens: request.max_tokens || 2048,
      messages,
      temperature: request.temperature,
      top_p: request.top_p,
      stream: false,
    };
    if (system) body.system = system;

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timer);

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error?.message || `Anthropic returned status ${res.status}`;
        const category = categorizeProviderError(res.status, errorMsg);
        throw new GatewayError(errorMsg, category, res.status, undefined, data);
      }

      // Extract text content
      const text = (data.content || [])
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('');

      const usage: TokenUsage | undefined = data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined;

      const normalizedResponse: ChatCompletionResponse = {
        id: data.id || `chatcmpl-ant-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: text,
            },
            finish_reason: data.stop_reason === 'max_tokens' ? 'length' : 'stop',
          },
        ],
        usage: usage
          ? {
              prompt_tokens: usage.promptTokens,
              completion_tokens: usage.completionTokens,
              total_tokens: usage.totalTokens,
            }
          : undefined,
      };

      return {
        response: normalizedResponse,
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
        isTimeout ? `Anthropic request timed out after ${timeoutMs}ms` : `Anthropic error: ${err.message}`,
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
    const url = `${baseUrl || 'https://api.anthropic.com/v1'}/messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const { system, messages } = this.translateMessages(request);
    const body: Record<string, any> = {
      model: request.model,
      max_tokens: request.max_tokens || 2048,
      messages,
      temperature: request.temperature,
      stream: true,
    };
    if (system) body.system = system;

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data?.error?.message || `Anthropic returned status ${res.status}`;
        const category = categorizeProviderError(res.status, errorMsg);
        throw new GatewayError(errorMsg, category, res.status, undefined, data);
      }

      let capturedUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const reader = res.body?.getReader();
      if (!reader) {
        throw new GatewayError('No body returned from Anthropic', ErrorCategory.INTERNAL_GATEWAY_ERROR, 502);
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buffer = '';

      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'message_start' && event.message?.usage) {
                  capturedUsage.promptTokens = event.message.usage.input_tokens;
                  capturedUsage.totalTokens = capturedUsage.promptTokens;
                } else if (event.type === 'content_block_delta' && event.delta?.text) {
                  const chunk = {
                    id: `chatcmpl-ant-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: request.model,
                    choices: [
                      {
                        index: 0,
                        delta: { content: event.delta.text },
                        finish_reason: null,
                      },
                    ],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } else if (event.type === 'message_delta' && event.usage) {
                  capturedUsage.completionTokens = event.usage.output_tokens;
                  capturedUsage.totalTokens = capturedUsage.promptTokens + capturedUsage.completionTokens;
                }
              } catch (_) {
                // pass
              }
            }
          }
        },
        cancel() {
          reader.cancel();
        },
      });

      return {
        stream,
        getUsage: () => (capturedUsage.totalTokens > 0 ? capturedUsage : null),
        statusCode: res.status,
        latencyMs,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof GatewayError) throw err;
      const isTimeout = err.name === 'AbortError';
      throw new GatewayError(
        isTimeout ? `Anthropic streaming timed out after ${timeoutMs}ms` : `Anthropic error: ${err.message}`,
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
    const url = `${baseUrl || 'https://api.anthropic.com/v1'}/messages`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          success: true,
          message: 'Connection verified successfully. Anthropic API key is valid.',
          latencyMs,
        };
      }
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data?.error?.message || `Authentication failed: HTTP ${res.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network failure connecting to Anthropic: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
