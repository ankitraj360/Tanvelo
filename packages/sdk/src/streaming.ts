import { ChatCompletionChunk } from './types.js';

export async function* parseEventStream(
  response: Response
): AsyncGenerator<ChatCompletionChunk, void, unknown> {
  if (!response.body) {
    throw new Error('Streaming response has no body to read.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            yield parsed as ChatCompletionChunk;
          } catch {
            // Ignore non-json heartbeats or comments
          }
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        const dataStr = trimmed.slice(5).trim();
        if (dataStr !== '[DONE]') {
          try {
            yield JSON.parse(dataStr) as ChatCompletionChunk;
          } catch {
            // Ignore
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
