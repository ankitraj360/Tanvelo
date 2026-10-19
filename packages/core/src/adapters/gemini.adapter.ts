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

export class GeminiAdapter implements ProviderAdapter {
  providerName = 'gemini';

  private translateMessages(request: ChatCompletionRequest): {
    systemInstruction?: { parts: Array<{ text: string }> };
    contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  } {
    let systemText = '';
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        systemText = systemText ? `${systemText}\n${msg.content}` : msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    return {
      systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
      contents,
    };
  }

  async execute(
    request: ChatCompletionRequest,
    apiKey: string,
    baseUrl?: string | null,
    timeoutMs: number = 30000
  ): Promise<ProviderExecutionResult> {
    const root = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = request.model.startsWith('models/') ? request.model : `models/${request.model}`;
    const url = `${root}/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const { systemInstruction, contents } = this.translateMessages(request);
    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: request.temperature,
        topP: request.top_p,
        maxOutputTokens: request.max_tokens,
      },
    };
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timer);

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error?.message || `Gemini returned status ${res.status}`;
        const category = categorizeProviderError(res.status, errorMsg);
        throw new GatewayError(errorMsg, category, res.status, undefined, data);
      }

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';

      const usage: TokenUsage | undefined = data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      const normalizedResponse: ChatCompletionResponse = {
        id: `chatcmpl-gem-${Date.now()}`,
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
            finish_reason: candidate?.finishReason === 'STOP' ? 'stop' : 'length',
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
        isTimeout ? `Gemini request timed out after ${timeoutMs}ms` : `Gemini error: ${err.message}`,
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
    const root = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = request.model.startsWith('models/') ? request.model : `models/${request.model}`;
    const url = `${root}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const { systemInstruction, contents } = this.translateMessages(request);
    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: request.temperature,
        topP: request.top_p,
        maxOutputTokens: request.max_tokens,
      },
    };
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      clearTimeout(timer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data?.error?.message || `Gemini returned status ${res.status}`;
        const category = categorizeProviderError(res.status, errorMsg);
        throw new GatewayError(errorMsg, category, res.status, undefined, data);
      }

      let capturedUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const reader = res.body?.getReader();
      if (!reader) {
        throw new GatewayError('No body returned from Gemini', ErrorCategory.INTERNAL_GATEWAY_ERROR, 502);
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
                const data = JSON.parse(line.slice(6));
                const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';

                if (data.usageMetadata) {
                  capturedUsage.promptTokens = data.usageMetadata.promptTokenCount || 0;
                  capturedUsage.completionTokens = data.usageMetadata.candidatesTokenCount || 0;
                  capturedUsage.totalTokens = data.usageMetadata.totalTokenCount || 0;
                }

                if (text) {
                  const chunk = {
                    id: `chatcmpl-gem-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: request.model,
                    choices: [
                      {
                        index: 0,
                        delta: { content: text },
                        finish_reason: null,
                      },
                    ],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
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
        isTimeout ? `Gemini streaming timed out after ${timeoutMs}ms` : `Gemini error: ${err.message}`,
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
    const root = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const url = `${root}/models?key=${apiKey}`;
    const start = Date.now();
    try {
      const res = await fetch(url);
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          success: true,
          message: 'Connection verified successfully. Google Gemini API key is valid.',
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
        message: `Network failure connecting to Gemini: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
