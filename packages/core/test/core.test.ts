import { describe, it, expect, vi } from 'vitest';
import {
  encryptApiKey,
  decryptApiKey,
  generateGatewayApiKey,
  hashGatewayKey,
  validateEncryptionConfig,
  calculateCost,
  categorizeProviderError,
  ErrorCategory,
  validateWebhookUrl,
  computeWebhookSignature,
  RoutingEngine,
  OpenAIAdapter,
  AnthropicAdapter,
  GeminiAdapter,
} from '../src/index.js';

describe('Cryptography & Security Controls', () => {
  it('encrypts and decrypts provider API keys securely with AES-256-GCM', () => {
    const originalKey = 'sk-proj-test1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encryptApiKey(originalKey);

    expect(encrypted).not.toBe(originalKey);
    expect(encrypted.split(':').length).toBe(3); // iv:tag:data

    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(originalKey);
  });

  it('generates secure gateway API keys with prefix and SHA-256 hash', () => {
    const { rawKey, keyPrefix, keyHash } = generateGatewayApiKey('live');

    expect(rawKey.startsWith('tv_live_')).toBe(true);
    expect(keyPrefix.startsWith('tv_live_')).toBe(true);
    expect(keyPrefix.endsWith('...')).toBe(true);

    const recomputedHash = hashGatewayKey(rawKey);
    expect(keyHash).toBe(recomputedHash);
  });
});

describe('Cost Calculator', () => {
  it('calculates cost accurately and provides transparent explanation', () => {
    const usage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
    const pricing = { inputPricePerMillion: 2.50, outputPricePerMillion: 10.00 };

    const result = calculateCost(usage, pricing);
    // 1000 * 2.5 / 1M = 0.0025
    // 500 * 10 / 1M = 0.005
    // total = 0.0075
    expect(result.estimatedCost).toBe(0.0075);
    expect(result.isComplete).toBe(true);
    expect(result.explanation).toContain('1000 input tokens');
    expect(result.explanation).toContain('500 output tokens');
  });

  it('handles missing usage without fabricating metrics', () => {
    const pricing = { inputPricePerMillion: 2.50, outputPricePerMillion: 10.00 };
    const result = calculateCost(null, pricing);

    expect(result.estimatedCost).toBe(0);
    expect(result.isComplete).toBe(false);
    expect(result.explanation).toContain('Usage data not returned');
  });
});

describe('Error Categorization', () => {
  it('categorizes upstream errors correctly according to PRD section 13', () => {
    expect(categorizeProviderError(401, 'Unauthorized API key')).toBe(ErrorCategory.PROVIDER_AUTH_FAILURE);
    expect(categorizeProviderError(429, 'Rate limit reached')).toBe(ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED);
    expect(categorizeProviderError(429, 'You exceeded your current quota')).toBe(ErrorCategory.PROVIDER_QUOTA_EXHAUSTED);
    expect(categorizeProviderError(504, 'Gateway timeout')).toBe(ErrorCategory.TIMEOUT);
    expect(categorizeProviderError(503, 'Service unavailable')).toBe(ErrorCategory.PROVIDER_UNAVAILABLE);
    expect(categorizeProviderError(404, 'Model gpt-99 not found')).toBe(ErrorCategory.UNSUPPORTED_MODEL);
  });
});

describe('SSRF Protection & Webhooks', () => {
  it('blocks loopback and private IP webhook destinations', async () => {
    const loopback = await validateWebhookUrl('http://127.0.0.1:8080/webhook');
    expect(loopback.valid).toBe(false);

    const localhost = await validateWebhookUrl('http://localhost:3000/api/hook');
    expect(localhost.valid).toBe(false);

    const privateIp = await validateWebhookUrl('http://192.168.1.1/hook');
    expect(privateIp.valid).toBe(false);

    const metadata = await validateWebhookUrl('http://169.254.169.254/latest/meta-data/');
    expect(metadata.valid).toBe(false);
  });

  it('computes valid HMAC-SHA256 signatures for webhook payloads', () => {
    const secret = 'whsec_test_secret_key_123';
    const payload = '{"event":"test.ping"}';
    const sig1 = computeWebhookSignature(payload, secret);
    const sig2 = computeWebhookSignature(payload, secret);

    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64); // SHA-256 hex length
  });
});

describe('Deterministic Routing Engine', () => {
  const router = new RoutingEngine();

  it('matches wildcard and specific model routing rules', () => {
    const rules = [
      {
        id: '1',
        modelPattern: 'gpt-4o',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        secondaryProvider: 'anthropic',
        secondaryModel: 'claude-3-5-sonnet-20241022',
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
        timeoutMs: 15000,
        maxRetries: 2,
        priority: 10,
      },
      {
        id: '2',
        modelPattern: '*',
        primaryProvider: 'gemini',
        primaryModel: 'gemini-1.5-flash',
        secondaryProvider: null,
        secondaryModel: null,
        fallbackOnTimeout: false,
        fallbackOnRateLimit: false,
        fallbackOnError: false,
        timeoutMs: 30000,
        maxRetries: 1,
        priority: 0,
      },
    ];

    const matchGpt = router.resolveRoute('gpt-4o', rules);
    expect(matchGpt.primaryProvider).toBe('openai');
    expect(matchGpt.secondaryProvider).toBe('anthropic');
    expect(matchGpt.timeoutMs).toBe(15000);

    const matchOther = router.resolveRoute('other-custom-model', rules);
    expect(matchOther.primaryProvider).toBe('gemini');
    expect(matchOther.primaryModel).toBe('gemini-1.5-flash');
  });

  it('supports per-request X-Tanvelo-Fallbacks overrides', () => {
    const rules = [
      {
        id: '1',
        modelPattern: 'gpt-4o',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        secondaryProvider: 'anthropic',
        secondaryModel: 'claude-3-5-sonnet',
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
        timeoutMs: 15000,
        maxRetries: 2,
        priority: 10,
      },
    ];

    const matchWithFallback = router.resolveRoute('gpt-4o', rules, 'gemini/gemini-1.5-flash');
    expect(matchWithFallback.primaryProvider).toBe('openai');
    expect(matchWithFallback.primaryModel).toBe('gpt-4o');
    expect(matchWithFallback.secondaryProvider).toBe('gemini');
    expect(matchWithFallback.secondaryModel).toBe('gemini-1.5-flash');
    expect(matchWithFallback.fallbackOnError).toBe(true);
  });

  it('attempts configured secondary fallback even when maxRetries is 1', async () => {
    let callCount = 0;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Primary fails with 500
        return new Response(JSON.stringify({ error: 'Primary OpenAI failure' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Secondary succeeds with 200
      return new Response(
        JSON.stringify({
          id: 'msg_sec_1',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Anthropic fallback success' }],
          model: 'claude-3-5-sonnet',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const rules = [
      {
        id: 'rule-retry-1',
        modelPattern: 'gpt-4o',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        secondaryProvider: 'anthropic',
        secondaryModel: 'claude-3-5-sonnet',
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
        timeoutMs: 5000,
        maxRetries: 1, // Notice: maxRetries = 1
        priority: 10,
      },
    ];

    const connections = new Map([
      ['openai', { provider: 'openai', apiKey: 'sk-mock-key', apiBaseUrl: null, status: 'connected' }],
      ['anthropic', { provider: 'anthropic', apiKey: 'sk-ant-mock', apiBaseUrl: null, status: 'connected' }],
    ]);

    try {
      const outcome = await router.executeChat(
        { model: 'gpt-4o', messages: [{ role: 'user', content: 'test' }] },
        rules,
        connections
      );

      expect(outcome.finalProvider).toBe('anthropic');
      expect(outcome.finalModel).toBe('claude-3-5-sonnet');
      expect(outcome.attempts.length).toBe(2);
      expect(outcome.attempts[0].isSuccess).toBe(false);
      expect(outcome.attempts[1].isSuccess).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('SSRF Hardening Tests', () => {
  it('blocks IPv4-mapped IPv6 addresses', async () => {
    const res1 = await validateWebhookUrl('http://[::ffff:127.0.0.1]/hook');
    expect(res1.valid).toBe(false);

    const res2 = await validateWebhookUrl('http://[::ffff:10.0.0.1]/hook');
    expect(res2.valid).toBe(false);
  });

  it('blocks CGNAT (100.64.0.0/10) addresses', async () => {
    const res = await validateWebhookUrl('http://100.64.0.1/hook');
    expect(res.valid).toBe(false);
  });

  it('blocks Benchmarking (198.18.0.0/15) addresses', async () => {
    const res = await validateWebhookUrl('http://198.18.0.1/hook');
    expect(res.valid).toBe(false);
  });

  it('blocks Documentation addresses (TEST-NET 1, 2, 3)', async () => {
    const res1 = await validateWebhookUrl('http://192.0.2.1/hook');
    expect(res1.valid).toBe(false);

    const res2 = await validateWebhookUrl('http://198.51.100.1/hook');
    expect(res2.valid).toBe(false);

    const res3 = await validateWebhookUrl('http://203.0.113.1/hook');
    expect(res3.valid).toBe(false);
  });

  it('blocks multicast addresses', async () => {
    const res = await validateWebhookUrl('http://224.0.0.1/hook');
    expect(res.valid).toBe(false);
  });

  it('blocks URLs with embedded credentials', async () => {
    const res = await validateWebhookUrl('https://admin:pass@example.com/hook');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('credentials');
  });

  it('blocks non-HTTP/HTTPS protocols', async () => {
    const res1 = await validateWebhookUrl('ftp://example.com/hook');
    expect(res1.valid).toBe(false);

    const res2 = await validateWebhookUrl('file:///etc/passwd');
    expect(res2.valid).toBe(false);
  });
});

describe('Provider Adapter Mocked Fetch Contract Tests', () => {
  it('executes OpenAI adapter and maps response to standard schema', async () => {
    const adapter = new OpenAIAdapter();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          id: 'chatcmpl-mock-openai-123',
          object: 'chat.completion',
          created: 1700000000,
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'OpenAI Mocked Answer' },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 8,
            total_tokens: 23,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    try {
      const res = await adapter.execute(
        { model: 'gpt-4o', messages: [{ role: 'user', content: 'hello' }] },
        'sk-mock-key'
      );

      expect(res.statusCode).toBe(200);
      expect(res.response.choices[0].message.content).toBe('OpenAI Mocked Answer');
      expect(res.usage?.promptTokens).toBe(15);
      expect(res.usage?.completionTokens).toBe(8);
      expect(res.usage?.totalTokens).toBe(23);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('executes Anthropic adapter and maps Claude format to standard schema', async () => {
    const adapter = new AnthropicAdapter();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          id: 'msg_anthropic_mock_456',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Anthropic Claude Answer' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          usage: {
            input_tokens: 20,
            output_tokens: 10,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    try {
      const res = await adapter.execute(
        { model: 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: 'hello claude' }] },
        'sk-ant-mock-key'
      );

      expect(res.statusCode).toBe(200);
      expect(res.response.choices[0].message.content).toBe('Anthropic Claude Answer');
      expect(res.usage?.promptTokens).toBe(20);
      expect(res.usage?.completionTokens).toBe(10);
      expect(res.usage?.totalTokens).toBe(30);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('executes Gemini adapter and maps Google format to standard schema', async () => {
    const adapter = new GeminiAdapter();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'Google Gemini Answer' }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
          usageMetadata: {
            promptTokenCount: 18,
            candidatesTokenCount: 12,
            totalTokenCount: 30,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    try {
      const res = await adapter.execute(
        { model: 'gemini-1.5-flash', messages: [{ role: 'user', content: 'hello gemini' }] },
        'AIza-mock-key'
      );

      expect(res.statusCode).toBe(200);
      expect(res.response.choices[0].message.content).toBe('Google Gemini Answer');
      expect(res.usage?.promptTokens).toBe(18);
      expect(res.usage?.completionTokens).toBe(12);
      expect(res.usage?.totalTokens).toBe(30);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('correctly maps 401 provider error to PROVIDER_AUTH_FAILURE GatewayError', async () => {
    const adapter = new OpenAIAdapter();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({ error: { message: 'Incorrect API key provided' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    });

    try {
      await expect(
        adapter.execute({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] }, 'sk-bad-key')
      ).rejects.toMatchObject({
        statusCode: 401,
        category: ErrorCategory.PROVIDER_AUTH_FAILURE,
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('Encryption Configuration Validation', () => {
  it('validates 64-hex char encryption secret successfully', () => {
    const validSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    expect(() => validateEncryptionConfig(validSecret)).not.toThrow();
  });

  it('refuses production startup if encryption secret is missing or not 64-hex chars', () => {
    expect(() => validateEncryptionConfig('', true)).toThrow(/FATAL SECURITY CONFIGURATION/);
    expect(() => validateEncryptionConfig('short-secret', true)).toThrow(/FATAL SECURITY CONFIGURATION/);
    expect(() => validateEncryptionConfig('not-hex-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', true)).toThrow(
      /FATAL SECURITY CONFIGURATION/
    );
  });
});

