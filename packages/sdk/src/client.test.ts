import { Tanvelo } from './client.js';
import { describe, it, expect, vi } from 'vitest';

describe('Tanvelo SDK', () => {
  it('instantiates correctly with default and custom options', () => {
    const client = new Tanvelo({
      apiKey: 'test-key',
      baseUrl: 'http://localhost:4000/v1',
    });
    expect(client).toBeDefined();
    expect(client.chat).toBeDefined();
    expect(client.chat.completions).toBeDefined();
    expect(client.models).toBeDefined();
  });

  it('sends correct request payload to chat completions', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'x-tanvelo-request-id': 'req_123',
        'x-tanvelo-provider': 'openai',
        'x-tanvelo-model': 'gpt-4o',
        'x-tanvelo-latency-ms': '120',
        'x-tanvelo-cost-usd': '0.0025',
      }),
      json: async () => ({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1700000000,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello from Tanvelo!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const client = new Tanvelo({
      apiKey: 'test-key',
      baseUrl: 'http://localhost:4000/v1',
      fetch: mockFetch as any,
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
      fallbacks: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/v1/chat/completions');
    expect(options.headers['Authorization']).toBe('Bearer test-key');
    expect(options.headers['X-Tanvelo-Fallbacks']).toBe('claude-3-5-sonnet,gemini-1.5-pro');

    const sentBody = JSON.parse(options.body);
    expect(sentBody.model).toBe('gpt-4o');
    expect(sentBody.messages[0].content).toBe('Hi');

    expect(completion.id).toBe('chatcmpl-123');
    expect(completion.choices[0].message.content).toBe('Hello from Tanvelo!');
    expect(completion._tanvelo?.provider).toBe('openai');
    expect(completion._tanvelo?.latencyMs).toBe(120);
  });

  it('maps models.list() items and throws TanveloError on non-200 (P1 #6)', async () => {
    const mockFetchSuccess = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: 'list',
        data: [
          { id: 'gpt-4o', object: 'model', owned_by: 'openai', created: 1700000000 },
          { id: 'anthropic/claude-3-5-sonnet', object: 'model', owned_by: 'anthropic' },
        ],
      }),
    });

    const client = new Tanvelo({
      apiKey: 'test-key',
      baseUrl: 'http://localhost:4000/v1',
      fetch: mockFetchSuccess as any,
    });

    const list = await client.models.list();
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({
      id: 'gpt-4o',
      name: 'gpt-4o',
      provider: 'openai',
      object: 'model',
      created: 1700000000,
      owned_by: 'openai',
    });
    expect(list[1].provider).toBe('anthropic');

    // Non-200 throws TanveloError
    const mockFetchFail = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: 'Unauthorized Tanvelo API key', type: 'invalid_request_error' },
      }),
    });

    const clientFail = new Tanvelo({
      apiKey: 'bad-key',
      baseUrl: 'http://localhost:4000/v1',
      fetch: mockFetchFail as any,
    });

    await expect(clientFail.models.list()).rejects.toThrow('Unauthorized Tanvelo API key');
  });

  it('health() strips trailing /v1 correctly (P1 #6)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    const client = new Tanvelo({
      baseUrl: 'https://gateway.example.com/api/v1',
      fetch: mockFetch as any,
    });

    await client.health();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://gateway.example.com/api/health');
  });
});
