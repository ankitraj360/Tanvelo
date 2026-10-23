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
  OpenAICompatibleAdapter,
  getProviderCatalog,
  findProvider,
  searchProviders,
  isKnownProvider,
  buildAuthHeaders,
  getProviderAdapter,
  isKnownGatewayProvider,
  resolveCanonicalProvider,
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

  it('supports ordered multi-entry X-Tanvelo-Fallbacks chains (P1 #5)', () => {
    const rules = [
      {
        id: '1',
        modelPattern: 'gpt-4o',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
        timeoutMs: 15000,
        maxRetries: 1,
        priority: 10,
      },
    ];

    const route = router.resolveRoute(
      'gpt-4o',
      rules,
      'claude-3-5-sonnet, gemini/gemini-1.5-pro, groq/llama-3-70b'
    );
    expect(route.fallbackChain).toHaveLength(3);
    expect(route.fallbackChain[0]).toEqual({ provider: 'anthropic', model: 'claude-3-5-sonnet' });
    expect(route.fallbackChain[1]).toEqual({ provider: 'gemini', model: 'gemini-1.5-pro' });
    expect(route.fallbackChain[2]).toEqual({ provider: 'groq', model: 'llama-3-70b' });
  });

  it('routes to OpenRouter for nemotron or openrouter-prefixed models without falling back to OpenAI', () => {
    const connections = new Map<string, any>([
      ['openai', { provider: 'openai', status: 'unconfigured', apiKey: '' }],
      ['openrouter', { provider: 'openrouter', status: 'connected', apiKey: 'sk-or-v1-test' }],
    ]);

    // Even if a wildcard rule exists pointing to unconfigured openai
    const rules = [
      {
        id: 'wildcard-rule',
        modelPattern: '*',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        priority: 0,
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
      },
    ];

    // 1. Calling nemotron directly
    const routeNemotron = router.resolveRoute(
      'nemotron-3.5-super-vl:free',
      rules,
      null,
      connections
    );
    expect(routeNemotron.primaryProvider).toBe('openrouter');
    expect(routeNemotron.primaryModel).toBe('nemotron-3.5-super-vl:free');

    // 2. Calling with explicit openrouter prefix
    const routePrefixed = router.resolveRoute(
      'openrouter/meta-llama/llama-3.3-70b-instruct',
      rules,
      null,
      connections
    );
    expect(routePrefixed.primaryProvider).toBe('openrouter');
    expect(routePrefixed.primaryModel).toBe('meta-llama/llama-3.3-70b-instruct');
  });

  it('executes ordered multi-entry fallback chain until success (P1 #5)', async () => {
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
      if (callCount === 2) {
        // 1st fallback (Anthropic) fails with 500
        return new Response(JSON.stringify({ error: 'Anthropic failure' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // 2nd fallback (Gemini) succeeds
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: 'Gemini 2nd fallback succeeded!' }] },
              finishReason: 'STOP',
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const connections = new Map<string, any>([
      ['openai', { provider: 'openai', apiKey: 'sk-test', status: 'connected' }],
      ['anthropic', { provider: 'anthropic', apiKey: 'sk-ant-test', status: 'connected' }],
      ['gemini', { provider: 'gemini', apiKey: 'AIzaSyTest', status: 'connected' }],
    ]);

    const outcome = await router.executeChat(
      { model: 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }] },
      [],
      connections,
      'claude-3-5-sonnet,gemini/gemini-1.5-flash'
    );

    expect(outcome.finalProvider).toBe('gemini');
    expect(outcome.finalModel).toBe('gemini-1.5-flash');
    expect(outcome.attempts).toHaveLength(3);
    expect(outcome.attempts[0].isSuccess).toBe(false);
    expect(outcome.attempts[1].isSuccess).toBe(false);
    expect(outcome.attempts[2].isSuccess).toBe(true);

    fetchSpy.mockRestore();
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

describe('Universal 140+ Provider Catalog', () => {
  it('contains at least 140 verified providers', () => {
    const catalog = getProviderCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(140);
  });

  it('correctly resolves provider aliases', () => {
    expect(resolveCanonicalProvider('together_ai')).toBe('together');
    expect(resolveCanonicalProvider('fireworks_ai')).toBe('fireworks');
    expect(resolveCanonicalProvider('google')).toBe('gemini');
    expect(resolveCanonicalProvider('azure-openai')).toBe('azure');
    expect(resolveCanonicalProvider('qwen')).toBe('dashscope');
    expect(resolveCanonicalProvider('cerebras')).toBe('cerebras');
  });

  it('searches providers by text query, category, and tags', () => {
    const groqMatches = searchProviders('groq');
    expect(groqMatches.length).toBeGreaterThan(0);
    expect(groqMatches[0].id).toBe('groq');

    const siliconProviders = searchProviders('', 'fast');
    expect(siliconProviders.some((p) => p.id === 'cerebras')).toBe(true);
    expect(siliconProviders.some((p) => p.id === 'groq')).toBe(true);

    const localProviders = searchProviders('ollama');
    expect(localProviders.some((p) => p.id === 'ollama')).toBe(true);
  });

  it('verifies provider existence via isKnownProvider and isKnownGatewayProvider', () => {
    expect(isKnownProvider('cerebras')).toBe(true);
    expect(isKnownProvider('together_ai')).toBe(true);
    expect(isKnownProvider('vllm')).toBe(true);
    expect(isKnownGatewayProvider('cerebras')).toBe(true);
    expect(isKnownGatewayProvider('unknown-xyz-nonexistent')).toBe(false);

    // Custom connected provider dynamically recognized
    const customConns = new Map([
      ['my-custom-proxy', { provider: 'my-custom-proxy', apiKey: 'key', status: 'connected' }],
    ]);
    expect(isKnownGatewayProvider('my-custom-proxy', customConns as any)).toBe(true);
  });

  it('finds provider details with canonical base URL and placeholder keys', () => {
    const cerebras = findProvider('cerebras');
    expect(cerebras).toBeDefined();
    expect(cerebras?.baseUrl).toBe('https://api.cerebras.ai/v1');
    expect(cerebras?.category).toBe('fast');

    const deepseek = findProvider('deepseek');
    expect(deepseek).toBeDefined();
    expect(deepseek?.baseUrl).toBe('https://api.deepseek.com');
  });
});

describe('Universal Authentication & Header Handling (buildAuthHeaders)', () => {
  it('creates standard Bearer Authorization header for bearer keys', () => {
    const headers = buildAuthHeaders('sk-test-12345');
    expect(headers['Authorization']).toBe('Bearer sk-test-12345');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('handles Azure api-key syntax with colon prefix', () => {
    const headers = buildAuthHeaders('api-key: azure-secret-token-xyz');
    expect(headers['api-key']).toBe('azure-secret-token-xyz');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('handles custom header name and token syntax', () => {
    const headers = buildAuthHeaders('X-Custom-Auth-Token: custom_token_val_999');
    expect(headers['X-Custom-Auth-Token']).toBe('custom_token_val_999');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('supports unauthenticated local runners with empty or none keys', () => {
    const emptyHeaders = buildAuthHeaders('');
    expect(emptyHeaders['Authorization']).toBeUndefined();

    const noneHeaders = buildAuthHeaders('none');
    expect(noneHeaders['Authorization']).toBeUndefined();
  });
});

describe('Universal Routing for 140+ Providers & Custom Endpoints', () => {
  const router = new RoutingEngine();

  it('routes slash-notation catalog models directly to the provider', () => {
    const rules = [
      {
        id: 'wildcard',
        modelPattern: '*',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
        timeoutMs: 30000,
        maxRetries: 1,
        priority: 0,
      },
    ];

    // cerebras/llama3.3-70b should route to cerebras even if wildcard rule is openai
    const route = router.resolveRoute('cerebras/llama3.3-70b', rules);
    expect(route.primaryProvider).toBe('cerebras');
    expect(route.primaryModel).toBe('llama3.3-70b');

    // together/meta-llama/Llama-3.3-70B-Turbo
    const togetherRoute = router.resolveRoute('together/meta-llama/Llama-3.3-70B-Turbo', rules);
    expect(togetherRoute.primaryProvider).toBe('together');
    expect(togetherRoute.primaryModel).toBe('meta-llama/Llama-3.3-70B-Turbo');

    // colon notation: groq:llama-3.3-70b-versatile
    const colonRoute = router.resolveRoute('groq:llama-3.3-70b-versatile', rules);
    expect(colonRoute.primaryProvider).toBe('groq');
    expect(colonRoute.primaryModel).toBe('llama-3.3-70b-versatile');
  });

  it('routes to custom user-registered providers when prefix matches connection', () => {
    const rules: any[] = [];
    const connections = new Map<string, any>([
      [
        'internal-proxy',
        {
          provider: 'internal-proxy',
          apiKey: 'internal-key',
          apiBaseUrl: 'https://internal.corp/v1',
          status: 'connected',
        },
      ],
    ]);

    const route = router.resolveRoute('internal-proxy/finetuned-llama', rules, undefined, connections);
    expect(route.primaryProvider).toBe('internal-proxy');
    expect(route.primaryModel).toBe('finetuned-llama');
  });

  it('parses multi-entry fallbacks with catalog and custom providers', () => {
    const rules = [
      {
        id: 'rule-1',
        modelPattern: 'gpt-4o',
        primaryProvider: 'openai',
        primaryModel: 'gpt-4o',
        fallbackOnTimeout: true,
        fallbackOnRateLimit: true,
        fallbackOnError: true,
        timeoutMs: 15000,
        maxRetries: 1,
        priority: 10,
      },
    ];

    const route = router.resolveRoute(
      'gpt-4o',
      rules,
      'cerebras/llama3.3-70b, deepseek/deepseek-r1, mistral/mistral-large-latest'
    );

    expect(route.fallbackChain).toHaveLength(3);
    expect(route.fallbackChain[0]).toEqual({ provider: 'cerebras', model: 'llama3.3-70b' });
    expect(route.fallbackChain[1]).toEqual({ provider: 'deepseek', model: 'deepseek-r1' });
    expect(route.fallbackChain[2]).toEqual({ provider: 'mistral', model: 'mistral-large-latest' });
  });
});

describe('Dynamic Adapter Factory (getProviderAdapter)', () => {
  it('returns AnthropicAdapter for anthropic and claude', () => {
    expect(getProviderAdapter('anthropic')).toBeInstanceOf(AnthropicAdapter);
    expect(getProviderAdapter('claude')).toBeInstanceOf(AnthropicAdapter);
  });

  it('returns GeminiAdapter for gemini and google', () => {
    expect(getProviderAdapter('gemini')).toBeInstanceOf(GeminiAdapter);
    expect(getProviderAdapter('google')).toBeInstanceOf(GeminiAdapter);
  });

  it('returns OpenAIAdapter for openai default cloud', () => {
    expect(getProviderAdapter('openai')).toBeInstanceOf(OpenAIAdapter);
  });

  it('returns OpenAICompatibleAdapter with canonical baseUrl for catalog providers', () => {
    const cerebrasAdapter = getProviderAdapter('cerebras') as OpenAICompatibleAdapter;
    expect(cerebrasAdapter).toBeInstanceOf(OpenAICompatibleAdapter);
    expect(cerebrasAdapter.providerName).toBe('cerebras');
    expect(cerebrasAdapter.baseUrl).toBe('https://api.cerebras.ai/v1');

    const groqAdapter = getProviderAdapter('groq') as OpenAICompatibleAdapter;
    expect(groqAdapter).toBeInstanceOf(OpenAICompatibleAdapter);
    expect(groqAdapter.baseUrl).toBe('https://api.groq.com/openai/v1');
  });

  it('returns OpenAICompatibleAdapter for custom provider and custom base URL', () => {
    const customAdapter = getProviderAdapter('my-onprem-vllm', 'https://vllm.internal.net:8000/v1') as OpenAICompatibleAdapter;
    expect(customAdapter).toBeInstanceOf(OpenAICompatibleAdapter);
    expect(customAdapter.providerName).toBe('my-onprem-vllm');
    expect(customAdapter.baseUrl).toBe('https://vllm.internal.net:8000/v1');
  });
});

