import { describe, it, expect } from 'vitest';
import {
  encryptApiKey,
  decryptApiKey,
  generateGatewayApiKey,
  hashGatewayKey,
  calculateCost,
  categorizeProviderError,
  ErrorCategory,
  validateWebhookUrl,
  computeWebhookSignature,
  RoutingEngine,
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
});
