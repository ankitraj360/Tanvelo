import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServers, isLoopbackHost, validateManagementSecurity } from '../src/server.js';
import { gatewayService } from '../src/services/gateway.service.js';
import { prisma } from '@tanvelo/db';
import { generateGatewayApiKey, dispatchWebhookWithRetries } from '@tanvelo/core';

let publicGateway: FastifyInstance;
let managementServer: FastifyInstance;
let testKey: string;
let testKeyId: string;
let testProjectId: string;
let testEnvId: string;
let initialDefaultProvidersCount: number;

beforeAll(async () => {
  const servers = await createServers();
  publicGateway = servers.publicGateway;
  managementServer = servers.managementServer;
  await publicGateway.ready();
  await managementServer.ready();

  // Guard: verify default project exists and record its provider count (Critical #1)
  const defaultProj = await prisma.project.findFirst({
    where: { slug: 'default' },
    include: { providerConnections: true },
  });
  expect(defaultProj).toBeDefined();
  initialDefaultProvidersCount = defaultProj!.providerConnections.length;

  // Create an ISOLATED dedicated test project for this test run (Critical #1)
  const runId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const testProject = await prisma.project.create({
    data: {
      name: `Vitest Isolated Project ${runId}`,
      slug: `vitest-${runId}`,
      environments: {
        create: [
          { name: 'Testing', slug: 'test' },
        ],
      },
    },
    include: { environments: true },
  });

  testProjectId = testProject.id;
  testEnvId = testProject.environments[0].id;
  const { rawKey, keyPrefix, keyHash } = generateGatewayApiKey('test');
  testKey = rawKey;

  const keyRecord = await prisma.gatewayApiKey.create({
    data: {
      name: `Vitest Isolated Key ${runId}`,
      keyPrefix,
      keyHash,
      projectId: testProjectId,
      environmentId: testEnvId,
    },
  });
  testKeyId = keyRecord.id;
});

afterAll(async () => {
  try {
    // Clean up the entire isolated test project (cascades to all requests, keys, budgets, policies)
    if (testProjectId) {
      await prisma.project.delete({ where: { id: testProjectId } }).catch(() => {});
    }

    // Clean up any stray Vitest test projects
    await prisma.project.deleteMany({
      where: { slug: { startsWith: 'vitest-' } },
    });

    // Guard: Verify the seeded Default Project was completely untouched (Critical #1)
    const defaultProjAfter = await prisma.project.findFirst({
      where: { slug: 'default' },
      include: { providerConnections: true },
    });
    expect(defaultProjAfter?.providerConnections.length).toBe(initialDefaultProvidersCount);
  } catch (err) {
    console.error('Error in test cleanup:', err);
  } finally {
    if (publicGateway) await publicGateway.close();
    if (managementServer) await managementServer.close();
  }
});

describe('Gateway Management Security & Host Validation (Critical #3)', () => {
  it('identifies loopback hosts correctly', () => {
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('::1')).toBe(true);
    expect(isLoopbackHost('0.0.0.0')).toBe(false);
    expect(isLoopbackHost('192.168.1.10')).toBe(false);
  });

  it('allows loopback hosts without management secret', () => {
    const res = validateManagementSecurity('127.0.0.1', undefined, true);
    expect(res.safeHost).toBe('127.0.0.1');
    expect(res.warning).toBeUndefined();
  });

  it('forces 127.0.0.1 and warns in non-production when non-loopback has no secret', () => {
    const res = validateManagementSecurity('0.0.0.0', undefined, false);
    expect(res.safeHost).toBe('127.0.0.1');
    expect(res.warning).toContain('Forcing bind to 127.0.0.1');
  });

  it('refuses to start in production if non-loopback host lacks management secret', () => {
    expect(() => validateManagementSecurity('0.0.0.0', undefined, true)).toThrow(
      /FATAL SECURITY CONFIGURATION/
    );
  });

  it('allows non-loopback host in production when a valid secret is provided', () => {
    const res = validateManagementSecurity('0.0.0.0', 'strong-management-secret-1234', true);
    expect(res.safeHost).toBe('0.0.0.0');
    expect(res.warning).toBeUndefined();
  });
});

describe('Gateway Architecture & Listener Isolation', () => {
  it('GET /health returns 200 with database status ok and rate limiter status', async () => {
    const res = await publicGateway.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('ok');
    expect(body.rateLimiter).toBeDefined();
  });

  it('blocks management routes on the public gateway instance (Fix #1)', async () => {
    const res = await publicGateway.inject({
      method: 'GET',
      url: '/api/projects',
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('MANAGEMENT_PORT_RESTRICTED');
  });

  it('serves management routes on the private management listener (Fix #1)', async () => {
    const res = await managementServer.inject({
      method: 'GET',
      url: '/api/projects',
    });

    expect(res.statusCode).toBe(200);
    const projects = JSON.parse(res.body);
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('reports consistent Redis state between /health and /api/settings without connection leaks (High #4)', async () => {
    const healthRes = await publicGateway.inject({
      method: 'GET',
      url: '/health',
    });
    const healthBody = JSON.parse(healthRes.body);

    const settingsRes = await managementServer.inject({
      method: 'GET',
      url: '/api/settings',
    });
    const settingsBody = JSON.parse(settingsRes.body);

    expect(settingsRes.statusCode).toBe(200);
    expect(settingsBody.rateLimiter.distributed).toBe(healthBody.rateLimiter.distributed);
    expect(settingsBody.rateLimiter.backend).toBe(healthBody.rateLimiter.backend);
  });
});

describe('Authentication & Gateway Core Execution', () => {
  it('rejects /v1/chat/completions without Authorization header', async () => {
    const res = await publicGateway.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      payload: {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error.type).toBe('gateway_key_rejected');
  });

  it('rejects /v1/chat/completions with invalid Authorization key', async () => {
    const res = await publicGateway.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        Authorization: 'Bearer tv_invalid_fake_key_99999',
      },
      payload: {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error.type).toBe('gateway_key_rejected');
  });

  it('authenticates valid key and returns rate limit headers', async () => {
    const res = await publicGateway.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${testKey}`,
      },
      payload: {
        model: 'non-configured-provider-model',
        messages: [{ role: 'user', content: 'test' }],
      },
    });

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.error.type).toBe('provider_unavailable');
  });

  it('records attempt history and provider name for unconfigured providers (Fix #6)', async () => {
    const res = await publicGateway.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${testKey}`,
      },
      payload: {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'hello' }],
      },
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.error.type).toBe('provider_unavailable');

    const reqRecord = await prisma.gatewayRequest.findFirst({
      where: { keyId: testKeyId },
      orderBy: { createdAt: 'desc' },
      include: { attempts: true },
    });

    expect(reqRecord).toBeDefined();
    expect(reqRecord?.provider).not.toBe('unknown');
    expect(reqRecord?.attempts.length).toBeGreaterThanOrEqual(1);
    expect(reqRecord?.attempts[0].provider).toBe('openai');
  });
});

describe('Budget Controls & Concurrency', () => {
  it('updates budget spend atomically under concurrent requests (Fix #2)', async () => {
    const budget = await prisma.budget.create({
      data: {
        projectId: testProjectId,
        environmentId: testEnvId,
        maxBudgetUsd: 500,
        warningThresholdPercent: 80,
        hardLimitEnabled: false,
        currentSpendUsd: 0,
      },
    });

    try {
      const concurrentCount = 10;
      const promises = [];
      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          gatewayService.recordRequest({
            requestId: `req_concurrent_test_${i}_${Date.now()}`,
            ctx: {
              projectId: testProjectId,
              environmentId: testEnvId,
              apiKeyId: testKeyId,
              keyPrefix: 'tv_test...',
              projectName: 'Vitest Project',
              environmentName: 'Testing',
            },
            provider: 'openai',
            model: 'gpt-4o',
            statusCode: 200,
            status: 'success',
            totalLatencyMs: 100,
            providerLatencyMs: 80,
            usage: {
              promptTokens: 1000,
              completionTokens: 500,
              totalTokens: 1500,
            },
            pricing: {
              inputPricePerMillion: 2.5,
              outputPricePerMillion: 10.0,
            },
            attempts: [],
          })
        );
      }

      await Promise.all(promises);

      // Cost per request = (1000 * 2.5 / 1e6) + (500 * 10 / 1e6) = 0.0025 + 0.005 = 0.0075
      // 10 concurrent requests = 0.075
      const refreshedBudget = await prisma.budget.findUnique({
        where: { id: budget.id },
      });

      expect(refreshedBudget?.currentSpendUsd).toBeCloseTo(0.075, 4);
    } finally {
      await prisma.budget.delete({ where: { id: budget.id } });
      await prisma.gatewayRequest.deleteMany({
        where: { requestId: { startsWith: 'req_concurrent_test_' } },
      });
      await prisma.usageRecord.deleteMany({
        where: { keyId: testKeyId },
      });
    }
  });

  it('records budget hard-limit blocks as budget_exceeded and emits alert (Critical #2)', async () => {
    const hardLimitBudget = await prisma.budget.create({
      data: {
        projectId: testProjectId,
        environmentId: testEnvId,
        maxBudgetUsd: 0, // $0 limit blocks immediately
        warningThresholdPercent: 80,
        hardLimitEnabled: true,
        currentSpendUsd: 0,
      },
    });

    try {
      const res = await publicGateway.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: { Authorization: `Bearer ${testKey}` },
        payload: { model: 'gpt-4o', messages: [{ role: 'user', content: 'test budget' }] },
      });

      expect(res.statusCode).toBe(429);
      const body = JSON.parse(res.body);
      expect(body.error.type).toBe('budget_exceeded');

      // Stored request must have status 'budget_exceeded', NOT 'rate_limited'
      const reqRecord = await prisma.gatewayRequest.findFirst({
        where: { keyId: testKeyId },
        orderBy: { createdAt: 'desc' },
      });
      expect(reqRecord?.status).toBe('budget_exceeded');

      // Alert must be generated with severity critical
      const alert = await prisma.alert.findFirst({
        where: { projectId: testProjectId, alertType: 'budget_exceeded' },
      });
      expect(alert).toBeDefined();
    } finally {
      await prisma.budget.delete({ where: { id: hardLimitBudget.id } });
      await prisma.alert.deleteMany({ where: { projectId: testProjectId } });
    }
  });
});

describe('Rate Limiting & Precedence', () => {
  it('enforces rate-limit policy precedence: key-specific (rank 3) > environment (rank 2) > project-wide (rank 1) (Fix #3)', async () => {
    const projectPolicy = await prisma.rateLimitPolicy.create({
      data: {
        projectId: testProjectId,
        environmentId: null,
        keyId: null,
        requestsPerMinute: 1,
        isEnabled: true,
      },
    });

    const keyPolicy = await prisma.rateLimitPolicy.create({
      data: {
        projectId: testProjectId,
        environmentId: null,
        keyId: testKeyId,
        requestsPerMinute: 100,
        isEnabled: true,
      },
    });

    try {
      const ctx = {
        projectId: testProjectId,
        environmentId: testEnvId,
        apiKeyId: testKeyId,
        keyPrefix: 'tv_test...',
        projectName: 'Vitest Project',
        environmentName: 'Testing',
      };

      const rlResult = await gatewayService.checkRateLimits(ctx);
      expect(rlResult.limit).toBe(100);
      expect(rlResult.remaining).toBeGreaterThanOrEqual(0);
    } finally {
      await prisma.rateLimitPolicy.deleteMany({
        where: { id: { in: [projectPolicy.id, keyPolicy.id] } },
      });
    }
  });

  it('returns X-RateLimit-* headers on 429 when rate limit is exceeded (Fix #4)', async () => {
    const tightPolicy = await prisma.rateLimitPolicy.create({
      data: {
        projectId: testProjectId,
        environmentId: testEnvId,
        keyId: testKeyId,
        requestsPerMinute: 1,
        isEnabled: true,
      },
    });

    try {
      // First request consumes the single request
      await publicGateway.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: { Authorization: `Bearer ${testKey}` },
        payload: { model: 'non-configured-provider-model', messages: [{ role: 'user', content: 'test 1' }] },
      });

      // Second request in same minute must be 429 rate limited
      const res2 = await publicGateway.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: { Authorization: `Bearer ${testKey}` },
        payload: { model: 'non-configured-provider-model', messages: [{ role: 'user', content: 'test 2' }] },
      });

      expect(res2.statusCode).toBe(429);
      expect(res2.headers['x-ratelimit-limit']).toBe('1');
      expect(res2.headers['x-ratelimit-remaining']).toBe('0');
      expect(res2.headers['x-ratelimit-reset']).toBeDefined();
      const body = JSON.parse(res2.body);
      expect(body.error.type).toBe('gateway_rate_limit_exceeded');
    } finally {
      await prisma.rateLimitPolicy.delete({ where: { id: tightPolicy.id } });
    }
  });

  it('enforces tokensPerMinute rate limiting when token usage is exceeded (Fix #5)', async () => {
    const tokenPolicy = await prisma.rateLimitPolicy.create({
      data: {
        projectId: testProjectId,
        environmentId: testEnvId,
        keyId: testKeyId,
        requestsPerMinute: 1000,
        tokensPerMinute: 500,
        isEnabled: true,
      },
    });

    try {
      const rl = gatewayService.getRateLimiter();
      await rl.recordTokenUsage(`key:${testKeyId}`, 600);

      const ctx = {
        projectId: testProjectId,
        environmentId: testEnvId,
        apiKeyId: testKeyId,
        keyPrefix: 'tv_test...',
        projectName: 'Vitest Project',
        environmentName: 'Testing',
      };

      await expect(gatewayService.checkRateLimits(ctx)).rejects.toThrow(/tokens per minute allowed/);
    } finally {
      await prisma.rateLimitPolicy.delete({ where: { id: tokenPolicy.id } });
    }
  });
});

describe('Webhooks & Provider Security', () => {
  it('dispatches webhooks with exponential backoff and records attempt logs (Fix #7)', async () => {
    const dummyPayload = {
      id: 'evt_test_retry',
      event: 'provider.unavailable',
      timestamp: new Date().toISOString(),
      data: { reason: 'test failure' },
    };

    const attempts = await dispatchWebhookWithRetries(
      'https://203.0.113.1/webhook-test', // TEST-NET-3 IP, non-routable
      'whsec_test_secret',
      dummyPayload,
      2,
      400,
      50
    );

    expect(Array.isArray(attempts)).toBe(true);
    expect(attempts.length).toBe(2);
    expect(attempts[0].attemptNumber).toBe(1);
    expect(attempts[0].isSuccess).toBe(false);
    expect(attempts[1].attemptNumber).toBe(2);
    expect(attempts[1].isSuccess).toBe(false);
  });

  it('manual webhook test endpoint executes retries and records delivery logs (Medium #6)', async () => {
    const testWebhook = await prisma.webhook.create({
      data: {
        projectId: testProjectId,
        url: 'https://203.0.113.1/manual-test-fail',
        secret: 'whsec_manual_test_secret',
        events: ['*'],
        isEnabled: true,
      },
    });

    try {
      const res = await managementServer.inject({
        method: 'POST',
        url: `/api/webhooks/${testWebhook.id}/test`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.totalAttempts).toBe(3);
      expect(body.success).toBe(false);

      const deliveries = await prisma.webhookDelivery.findMany({
        where: { webhookId: testWebhook.id },
      });
      expect(deliveries.length).toBe(3);
    } finally {
      await prisma.webhookDelivery.deleteMany({ where: { webhookId: testWebhook.id } });
      await prisma.webhook.delete({ where: { id: testWebhook.id } });
    }
  }, 15000);

  it('marks failed provider connection test as error rather than connected (Fix #8)', async () => {
    // Tests inside testProjectId — Default Project is NOT touched
    const res = await managementServer.inject({
      method: 'POST',
      url: '/api/providers',
      payload: {
        projectId: testProjectId,
        provider: 'openai',
        apiKey: 'sk-invalid-fake-key-for-test',
        status: 'error',
        lastError: 'Incorrect API key provided',
        clientLastError: 'Incorrect API key provided',
      },
    });

    expect(res.statusCode).toBe(200);
    const saved = JSON.parse(res.body);
    expect(saved.status).toBe('error');
    expect(saved.lastError).toContain('Incorrect API key');

    const dbConn = await prisma.providerConnection.findUnique({
      where: {
        projectId_provider: {
          projectId: testProjectId,
          provider: 'openai',
        },
      },
    });

    expect(dbConn?.status).toBe('error');
  });
});
