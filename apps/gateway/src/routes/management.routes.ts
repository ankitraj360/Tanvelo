import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@tanvelo/db';
import {
  encryptApiKey,
  decryptApiKey,
  generateGatewayApiKey,
  generateWebhookSecret,
  getProviderAdapter,
  validateWebhookUrl,
  dispatchWebhook,
  dispatchWebhookWithRetries,
  WebhookPayload,
} from '@tanvelo/core';
import { gatewayService } from '../services/gateway.service.js';

export async function managementRoutes(fastify: FastifyInstance) {
  // ================= PROJECTS =================
  fastify.get('/api/projects', async (req: FastifyRequest, reply: FastifyReply) => {
    const projects = await prisma.project.findMany({
      include: {
        environments: true,
        _count: {
          select: {
            apiKeys: true,
            gatewayRequests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(projects);
  });

  fastify.post('/api/projects', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, description } = req.body as any;
    if (!name) return reply.status(400).send({ error: 'Project name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `proj-${Date.now()}`;

    // Verify slug uniqueness
    let finalSlug = slug;
    let count = 1;
    while (await prisma.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${count++}`;
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug: finalSlug,
        description,
        environments: {
          create: [
            { name: 'Production', slug: 'production' },
            { name: 'Staging', slug: 'staging' },
            { name: 'Development', slug: 'development' },
          ],
        },
      },
      include: { environments: true },
    });

    // Seed default models for project
    const defaultModels = [
      { modelId: 'gpt-4o', name: 'GPT-4o', provider: 'openai', inputPricePerMillion: 2.50, outputPricePerMillion: 10.00 },
      { modelId: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', inputPricePerMillion: 0.15, outputPricePerMillion: 0.60 },
      { modelId: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', inputPricePerMillion: 3.00, outputPricePerMillion: 15.00 },
      { modelId: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', inputPricePerMillion: 1.25, outputPricePerMillion: 5.00 },
      { modelId: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', inputPricePerMillion: 0.075, outputPricePerMillion: 0.30 },
    ];
    for (const m of defaultModels) {
      await prisma.modelConfig.create({
        data: { projectId: project.id, ...m },
      });
    }

    // Seed initial providers
    for (const p of ['openai', 'anthropic', 'gemini']) {
      await prisma.providerConnection.create({
        data: {
          projectId: project.id,
          provider: p,
          apiKeyEncrypted: '',
          apiKeyPreview: '',
          status: 'unconfigured',
        },
      });
    }

    return reply.status(201).send(project);
  });

  fastify.get('/api/projects/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const project = await prisma.project.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        environments: true,
        providerConnections: {
          select: {
            id: true,
            projectId: true,
            provider: true,
            customName: true,
            isCustom: true,
            apiKeyPreview: true,
            apiBaseUrl: true,
            status: true,
            lastTestedAt: true,
            lastError: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        modelConfigs: true,
        budgets: true,
      },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return reply.send(project);
  });

  fastify.patch('/api/projects/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const { name, description } = req.body as any;
    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
    });
    return reply.send(project);
  });

  fastify.delete('/api/projects/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    // Count total projects
    const total = await prisma.project.count();
    if (total <= 1) {
      return reply.status(400).send({ error: 'Cannot delete the only remaining project.' });
    }
    await prisma.project.delete({ where: { id } });
    return reply.send({ success: true });
  });

  // ================= ENVIRONMENTS =================
  fastify.get('/api/projects/:id/environments', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const envs = await prisma.environment.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(envs);
  });

  fastify.post('/api/projects/:id/environments', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const { name } = req.body as any;
    if (!name) return reply.status(400).send({ error: 'Environment name is required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const env = await prisma.environment.create({
      data: {
        projectId: id,
        name,
        slug,
      },
    });
    return reply.status(201).send(env);
  });

  // ================= PROVIDERS =================
  fastify.get('/api/providers', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const connections = await prisma.providerConnection.findMany({
      where: { projectId },
    });

    // Return sanitized objects without raw encrypted keys
    const sanitized = connections.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      provider: c.provider,
      customName: c.customName,
      isCustom: c.isCustom,
      apiKeyPreview: c.apiKeyPreview,
      apiBaseUrl: c.apiBaseUrl,
      status: c.status,
      lastTestedAt: c.lastTestedAt,
      lastError: c.lastError,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    return reply.send(sanitized);
  });

  fastify.post('/api/providers', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, provider, apiKey, apiBaseUrl, customName, isCustom, status } = req.body as any;
    const clientLastError = (req.body as any)?.lastError || (req.body as any)?.clientLastError;
    if (!projectId || !provider) {
      return reply.status(400).send({ error: 'projectId and provider are required' });
    }

    const isLocalProvider =
      provider === 'ollama' ||
      provider.startsWith('local') ||
      provider === 'vllm' ||
      provider === 'lmstudio' ||
      Boolean(apiBaseUrl && (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')));

    const keyVal = apiKey || (isLocalProvider ? 'local-key' : '');
    const encrypted = keyVal ? encryptApiKey(keyVal) : '';
    const preview = keyVal.length > 8
      ? `${keyVal.substring(0, 4)}...${keyVal.substring(keyVal.length - 4)}`
      : (keyVal ? (isLocalProvider ? 'local' : '****') : 'None');

    let finalStatus: 'connected' | 'error' | 'unconfigured' = 'unconfigured';
    let storedError: string | null = null;
    let storedTestedAt: Date | null = null;

    if (keyVal) {
      if (status === 'error') {
        finalStatus = 'error';
        storedError = clientLastError || 'Connection test failed';
      } else {
        const adapter = getProviderAdapter(provider, apiBaseUrl);
        if (adapter) {
          try {
            const testRes = await adapter.testConnection(keyVal, apiBaseUrl);
            finalStatus = testRes.success ? 'connected' : 'error';
            storedTestedAt = new Date();
            storedError = testRes.success ? null : testRes.message;
          } catch (e: any) {
            finalStatus = 'error';
            storedError = e.message;
          }
        } else {
          finalStatus = 'connected';
        }
      }
    }

    const conn = await prisma.providerConnection.upsert({
      where: { projectId_provider: { projectId, provider } },
      create: {
        projectId,
        provider,
        customName: customName || null,
        isCustom: Boolean(isCustom),
        apiKeyEncrypted: encrypted,
        apiKeyPreview: preview,
        apiBaseUrl: apiBaseUrl || null,
        status: finalStatus,
        lastError: storedError,
        lastTestedAt: storedTestedAt,
      },
      update: {
        customName: customName !== undefined ? customName : undefined,
        isCustom: isCustom !== undefined ? Boolean(isCustom) : undefined,
        apiKeyEncrypted: encrypted,
        apiKeyPreview: preview,
        apiBaseUrl: apiBaseUrl !== undefined ? apiBaseUrl : undefined,
        status: finalStatus,
        lastError: storedError,
        lastTestedAt: storedTestedAt || undefined,
      },
    });

    return reply.send({
      id: conn.id,
      provider: conn.provider,
      customName: conn.customName,
      isCustom: conn.isCustom,
      apiKeyPreview: conn.apiKeyPreview,
      status: conn.status,
      lastError: conn.lastError,
      lastTestedAt: conn.lastTestedAt,
    });
  });

  fastify.delete('/api/providers/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    await prisma.providerConnection.delete({ where: { id } });
    return reply.send({ success: true });
  });

  fastify.post('/api/providers/test', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, provider, apiKey, apiBaseUrl } = req.body as any;
    let keyToTest = apiKey;
    let effectiveBaseUrl = apiBaseUrl;

    if (projectId) {
      const existing = await prisma.providerConnection.findUnique({
        where: { projectId_provider: { projectId, provider } },
      });
      if (existing) {
        if (!keyToTest && existing.apiKeyEncrypted) {
          keyToTest = decryptApiKey(existing.apiKeyEncrypted);
        }
        if (!effectiveBaseUrl) {
          effectiveBaseUrl = existing.apiBaseUrl;
        }
      }
    }

    const isLocal =
      provider === 'ollama' ||
      provider.startsWith('local') ||
      provider === 'vllm' ||
      provider === 'lmstudio' ||
      Boolean(effectiveBaseUrl && (effectiveBaseUrl.includes('localhost') || effectiveBaseUrl.includes('127.0.0.1')));

    if (!keyToTest && isLocal) {
      keyToTest = 'local-test-token';
    }

    if (!keyToTest) {
      return reply.status(400).send({ error: 'No API key provided to test' });
    }

    const adapter = getProviderAdapter(provider, effectiveBaseUrl);
    if (!adapter) {
      return reply.status(400).send({ error: `Unsupported provider: ${provider}` });
    }

    const result = await adapter.testConnection(keyToTest, effectiveBaseUrl);

    // Update status in DB
    if (projectId) {
      await prisma.providerConnection.updateMany({
        where: { projectId, provider },
        data: {
          status: result.success ? 'connected' : 'error',
          lastTestedAt: new Date(),
          lastError: result.success ? null : result.message,
        },
      });
    }

    return reply.send(result);
  });

  // ================= MODELS =================
  fastify.get('/api/models', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const models = await prisma.modelConfig.findMany({
      where: { projectId },
      orderBy: { provider: 'asc' },
    });
    return reply.send(models);
  });

  fastify.patch('/api/models/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const { isEnabled, inputPricePerMillion, outputPricePerMillion } = req.body as any;

    const updated = await prisma.modelConfig.update({
      where: { id },
      data: {
        isEnabled: isEnabled !== undefined ? isEnabled : undefined,
        inputPricePerMillion: inputPricePerMillion !== undefined ? parseFloat(inputPricePerMillion) : undefined,
        outputPricePerMillion: outputPricePerMillion !== undefined ? parseFloat(outputPricePerMillion) : undefined,
      },
    });
    return reply.send(updated);
  });

  // ================= API KEYS =================
  fastify.get('/api/api-keys', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId } = req.query as any;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (environmentId) where.environmentId = environmentId;

    const keys = await prisma.gatewayApiKey.findMany({
      where,
      include: { environment: true, project: true },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        projectId: k.projectId,
        projectName: k.project.name,
        environmentId: k.environmentId,
        environmentName: k.environment.name,
        status: k.status,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      }))
    );
  });

  fastify.post('/api/api-keys', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId, name, expiresAt } = req.body as any;
    if (!projectId || !environmentId || !name) {
      return reply.status(400).send({ error: 'projectId, environmentId, and name are required' });
    }

    const env = await prisma.environment.findUnique({ where: { id: environmentId } });
    const { rawKey, keyPrefix, keyHash } = generateGatewayApiKey(env?.slug || 'live');

    const key = await prisma.gatewayApiKey.create({
      data: {
        name,
        projectId,
        environmentId,
        keyPrefix,
        keyHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return the rawKey ONLY on creation
    return reply.status(201).send({
      ...key,
      rawKey,
    });
  });

  fastify.delete('/api/api-keys/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const updated = await prisma.gatewayApiKey.update({
      where: { id },
      data: { status: 'revoked' },
    });
    return reply.send({ success: true, status: updated.status });
  });

  fastify.post('/api/api-keys/:id/rotate', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const oldKey = await prisma.gatewayApiKey.findUnique({
      where: { id },
      include: { environment: true },
    });
    if (!oldKey) return reply.status(404).send({ error: 'API key not found' });

    // Revoke old key
    await prisma.gatewayApiKey.update({
      where: { id },
      data: { status: 'revoked' },
    });

    // Generate new key
    const { rawKey, keyPrefix, keyHash } = generateGatewayApiKey(oldKey.environment.slug);
    const newKey = await prisma.gatewayApiKey.create({
      data: {
        name: `${oldKey.name} (Rotated)`,
        projectId: oldKey.projectId,
        environmentId: oldKey.environmentId,
        keyPrefix,
        keyHash,
      },
    });

    return reply.send({
      ...newKey,
      rawKey,
    });
  });

  // ================= ROUTING RULES =================
  fastify.get('/api/routing', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const where: any = { projectId };
    if (environmentId) where.environmentId = environmentId;

    const rules = await prisma.routingRule.findMany({
      where,
      include: { environment: true },
      orderBy: { priority: 'desc' },
    });
    return reply.send(rules);
  });

  fastify.post('/api/routing', async (req: FastifyRequest, reply: FastifyReply) => {
    const {
      projectId,
      environmentId,
      modelPattern,
      primaryProvider,
      primaryModel,
      secondaryProvider,
      secondaryModel,
      fallbackOnTimeout,
      fallbackOnRateLimit,
      fallbackOnError,
      timeoutMs,
      maxRetries,
      priority,
    } = req.body as any;

    if (!projectId || !environmentId || !modelPattern || !primaryProvider || !primaryModel) {
      return reply.status(400).send({ error: 'Missing required routing parameters' });
    }

    const rule = await prisma.routingRule.create({
      data: {
        projectId,
        environmentId,
        modelPattern,
        primaryProvider,
        primaryModel,
        secondaryProvider: secondaryProvider || null,
        secondaryModel: secondaryModel || null,
        fallbackOnTimeout: fallbackOnTimeout ?? true,
        fallbackOnRateLimit: fallbackOnRateLimit ?? true,
        fallbackOnError: fallbackOnError ?? true,
        timeoutMs: timeoutMs ? parseInt(timeoutMs) : 30000,
        maxRetries: maxRetries ? parseInt(maxRetries) : 2,
        priority: priority ? parseInt(priority) : 0,
      },
    });

    return reply.status(201).send(rule);
  });

  fastify.delete('/api/routing/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    await prisma.routingRule.delete({ where: { id } });
    return reply.send({ success: true });
  });

  // ================= RATE LIMITS =================
  fastify.get('/api/rate-limits', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const policies = await prisma.rateLimitPolicy.findMany({
      where: { projectId },
      include: { environment: true },
    });
    return reply.send(policies);
  });

  fastify.post('/api/rate-limits', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId, keyId, requestsPerMinute, requestsPerHour, requestsPerDay, tokensPerMinute } = req.body as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const policy = await prisma.rateLimitPolicy.create({
      data: {
        projectId,
        environmentId: environmentId || null,
        keyId: keyId || null,
        requestsPerMinute: requestsPerMinute ? parseInt(requestsPerMinute) : null,
        requestsPerHour: requestsPerHour ? parseInt(requestsPerHour) : null,
        requestsPerDay: requestsPerDay ? parseInt(requestsPerDay) : null,
        tokensPerMinute: tokensPerMinute ? parseInt(tokensPerMinute) : null,
        isEnabled: true,
      },
    });

    return reply.status(201).send(policy);
  });

  fastify.delete('/api/rate-limits/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    await prisma.rateLimitPolicy.delete({ where: { id } });
    return reply.send({ success: true });
  });

  fastify.patch('/api/rate-limits/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const { requestsPerMinute, requestsPerHour, requestsPerDay, tokensPerMinute, isEnabled } = req.body as any;
    const updated = await prisma.rateLimitPolicy.update({
      where: { id },
      data: {
        requestsPerMinute: requestsPerMinute !== undefined ? (requestsPerMinute ? parseInt(requestsPerMinute) : null) : undefined,
        requestsPerHour: requestsPerHour !== undefined ? (requestsPerHour ? parseInt(requestsPerHour) : null) : undefined,
        requestsPerDay: requestsPerDay !== undefined ? (requestsPerDay ? parseInt(requestsPerDay) : null) : undefined,
        tokensPerMinute: tokensPerMinute !== undefined ? (tokensPerMinute ? parseInt(tokensPerMinute) : null) : undefined,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
      },
    });
    return reply.send(updated);
  });

  // ================= REQUESTS & INSPECTOR =================
  fastify.get('/api/requests', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId, provider, model, status, search, page = '1', limit = '20' } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { projectId };
    if (environmentId) where.environmentId = environmentId;
    if (provider) where.provider = provider;
    if (model) where.model = model;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { requestId: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.gatewayRequest.count({ where }),
      prisma.gatewayRequest.findMany({
        where,
        select: {
          id: true,
          requestId: true,
          provider: true,
          model: true,
          status: true,
          statusCode: true,
          totalLatencyMs: true,
          providerLatencyMs: true,
          totalTokens: true,
          estimatedCost: true,
          errorCategory: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return reply.send({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests,
    });
  });

  fastify.get('/api/requests/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const request = await prisma.gatewayRequest.findFirst({
      where: { OR: [{ id }, { requestId: id }] },
      include: {
        attempts: { orderBy: { attemptNumber: 'asc' } },
        project: true,
        environment: true,
        apiKey: { select: { id: true, name: true, keyPrefix: true } },
      },
    });

    if (!request) return reply.status(404).send({ error: 'Request not found' });
    return reply.send(request);
  });

  // ================= ERRORS & FAILURES =================
  fastify.get('/api/errors', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const where: any = {
      projectId,
      status: { in: ['error', 'rate_limited', 'budget_exceeded'] },
    };
    if (environmentId) where.environmentId = environmentId;

    const [grouped, errorList] = await Promise.all([
      prisma.gatewayRequest.groupBy({
        by: ['errorCategory'],
        where,
        _count: { id: true },
      }),
      prisma.gatewayRequest.findMany({
        where,
        select: {
          id: true,
          requestId: true,
          provider: true,
          model: true,
          status: true,
          statusCode: true,
          errorCategory: true,
          errorMessage: true,
          totalLatencyMs: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return reply.send({
      breakdown: grouped.map((g) => ({
        category: g.errorCategory || 'uncategorized',
        count: g._count.id,
      })),
      errors: errorList,
    });
  });

  // ================= ANALYTICS =================
  fastify.get('/api/analytics', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId, days = '7' } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const daysNum = parseInt(days) || 7;
    const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const where: any = {
      projectId,
      createdAt: { gte: since },
    };
    if (environmentId) where.environmentId = environmentId;

    const [totalRequests, successfulRequests, failedRequests, avgLatencyAgg, providerGroup, modelGroup, records] =
      await Promise.all([
        prisma.gatewayRequest.count({ where }),
        prisma.gatewayRequest.count({ where: { ...where, status: 'success' } }),
        prisma.gatewayRequest.count({ where: { ...where, status: { not: 'success' } } }),
        prisma.gatewayRequest.aggregate({
          where,
          _avg: { totalLatencyMs: true },
          _sum: { totalTokens: true, estimatedCost: true },
        }),
        prisma.gatewayRequest.groupBy({
          by: ['provider'],
          where,
          _count: { id: true },
        }),
        prisma.gatewayRequest.groupBy({
          by: ['model'],
          where,
          _count: { id: true },
        }),
        prisma.gatewayRequest.findMany({
          where,
          select: { totalLatencyMs: true, createdAt: true, status: true, estimatedCost: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    // Calculate P95 latency
    let p95Latency = 0;
    if (records.length > 0) {
      const latencies = records.map((r) => r.totalLatencyMs).sort((a, b) => a - b);
      const p95Idx = Math.floor(latencies.length * 0.95);
      p95Latency = latencies[p95Idx] || 0;
    }

    // Time series grouping by date (pre-populate requested range so charts render a smooth timeline)
    const timeMap: Record<string, { date: string; requests: number; success: number; error: number; cost: number }> = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      timeMap[d] = { date: d, requests: 0, success: 0, error: 0, cost: 0 };
    }

    for (const r of records) {
      const d = r.createdAt.toISOString().slice(0, 10);
      if (!timeMap[d]) {
        timeMap[d] = { date: d, requests: 0, success: 0, error: 0, cost: 0 };
      }
      timeMap[d].requests++;
      if (r.status === 'success') timeMap[d].success++;
      else timeMap[d].error++;
      timeMap[d].cost += r.estimatedCost || 0;
    }

    const timeSeries = Object.values(timeMap).sort((a, b) => a.date.localeCompare(b.date));

    return reply.send({
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 ? Number(((successfulRequests / totalRequests) * 100).toFixed(1)) : 0,
        errorRate: totalRequests > 0 ? Number(((failedRequests / totalRequests) * 100).toFixed(1)) : 0,
        averageLatencyMs: Math.round(avgLatencyAgg._avg.totalLatencyMs || 0),
        p95LatencyMs: p95Latency,
        totalTokens: avgLatencyAgg._sum.totalTokens || 0,
        totalCost: Number((avgLatencyAgg._sum.estimatedCost || 0).toFixed(4)),
      },
      timeSeries,
      byProvider: providerGroup.map((p) => ({ provider: p.provider, count: p._count.id })),
      byModel: modelGroup.map((m) => ({ model: m.model, count: m._count.id })),
    });
  });

  // ================= USAGE & BUDGETS =================
  fastify.get('/api/budgets', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    let budget = null;
    if (environmentId) {
      budget = await prisma.budget.findFirst({
        where: { projectId, environmentId },
      });
    }
    if (!budget) {
      budget = await prisma.budget.findFirst({
        where: { projectId, environmentId: null },
      });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        projectId,
        ...(environmentId ? { OR: [{ environmentId }, { environmentId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return reply.send({
      budget: budget || {
        maxBudgetUsd: 100.0,
        warningThresholdPercent: 80.0,
        hardLimitEnabled: false,
        currentSpendUsd: 0.0,
        period: 'monthly',
      },
      alerts,
    });
  });

  fastify.get('/api/budgets/alerts', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId, limit } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const take = limit ? parseInt(limit, 10) : 20;
    const alerts = await prisma.alert.findMany({
      where: {
        projectId,
        ...(environmentId ? { OR: [{ environmentId }, { environmentId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return reply.send(alerts);
  });

  fastify.post('/api/budgets', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, environmentId, maxBudgetUsd, warningThresholdPercent, hardLimitEnabled, period } = req.body as any;
    if (!projectId || maxBudgetUsd === undefined) {
      return reply.status(400).send({ error: 'projectId and maxBudgetUsd are required' });
    }

    const cleanPeriod = period === 'daily' || period === 'total' ? period : 'monthly';
    const envId = environmentId || null;

    const existing = await prisma.budget.findFirst({
      where: { projectId, environmentId: envId },
    });

    // Compute next reset date
    let resetAt: Date | null = null;
    if (cleanPeriod === 'daily') {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      resetAt = d;
    } else if (cleanPeriod === 'monthly') {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() + 1);
      d.setUTCDate(1);
      d.setUTCHours(0, 0, 0, 0);
      resetAt = d;
    }

    let budget;
    if (existing) {
      budget = await prisma.budget.update({
        where: { id: existing.id },
        data: {
          maxBudgetUsd: parseFloat(maxBudgetUsd),
          warningThresholdPercent: parseFloat(warningThresholdPercent) || 80.0,
          hardLimitEnabled: Boolean(hardLimitEnabled),
          period: cleanPeriod,
          resetAt: existing.period !== cleanPeriod ? resetAt : (existing.resetAt || resetAt),
        },
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          projectId,
          environmentId: envId,
          maxBudgetUsd: parseFloat(maxBudgetUsd),
          warningThresholdPercent: parseFloat(warningThresholdPercent) || 80.0,
          hardLimitEnabled: Boolean(hardLimitEnabled),
          period: cleanPeriod,
          resetAt,
        },
      });
    }

    return reply.send(budget);
  });

  // ================= WEBHOOKS =================
  fastify.get('/api/webhooks', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as any;
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' });

    const webhooks = await prisma.webhook.findMany({
      where: { projectId },
      include: {
        _count: { select: { deliveries: true } },
      },
    });

    return reply.send(
      webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isEnabled: w.isEnabled,
        createdAt: w.createdAt,
        deliveryCount: w._count.deliveries,
      }))
    );
  });

  fastify.post('/api/webhooks', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, url, events } = req.body as any;
    if (!projectId || !url || !events || !Array.isArray(events)) {
      return reply.status(400).send({ error: 'projectId, url, and events array are required' });
    }

    // SSRF Check
    const check = await validateWebhookUrl(url);
    if (!check.valid) {
      return reply.status(400).send({ error: `URL rejected by SSRF protection: ${check.reason}` });
    }

    const secret = generateWebhookSecret();
    const webhook = await prisma.webhook.create({
      data: {
        projectId,
        url,
        secret,
        events,
      },
    });

    return reply.status(201).send({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret, // shown only once on creation
      isEnabled: webhook.isEnabled,
    });
  });

  fastify.delete('/api/webhooks/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    await prisma.webhook.delete({ where: { id } });
    return reply.send({ success: true });
  });

  fastify.post('/api/webhooks/:id/test', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) return reply.status(404).send({ error: 'Webhook not found' });

    const payload: WebhookPayload = {
      id: `evt_test_${Date.now()}`,
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: { message: 'Tanvelo Webhook Ping Test', projectId: webhook.projectId },
    };

    const attempts = await dispatchWebhookWithRetries(webhook.url, webhook.secret, payload, 3, 1500, 50);

    for (const res of attempts) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: 'test.ping',
          payload: payload as any,
          statusCode: res.statusCode,
          responseBody: res.responseBody,
          attemptNumber: res.attemptNumber,
          isSuccess: res.isSuccess,
          errorMessage: res.errorMessage,
        },
      });
    }

    const lastAttempt = attempts[attempts.length - 1];
    return reply.send({
      success: attempts.some((a) => a.isSuccess),
      totalAttempts: attempts.length,
      attempts,
      statusCode: lastAttempt?.statusCode,
      errorMessage: lastAttempt?.errorMessage,
      responseBody: lastAttempt?.responseBody,
    });
  });

  fastify.get('/api/webhooks/:id/deliveries', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return reply.send(deliveries);
  });

  // ================= SETTINGS & DIAGNOSTICS =================
  fastify.get('/api/settings', async (req: FastifyRequest, reply: FastifyReply) => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (_) {}

    const rlStatus = gatewayService.getRateLimiter().getStatus();

    return reply.send({
      service: 'Tanvelo LLM Gateway',
      version: '1.0.0',
      database: {
        engine: 'Neon PostgreSQL (Production Serverless)',
        connected: dbOk,
        mode: 'production',
        pooler: 'Neon PgBouncer Active',
      },
      rateLimiter: {
        engine: rlStatus.distributed ? 'Redis 7 Cluster' : 'In-Memory Sliding Window (Fallback)',
        distributed: rlStatus.distributed,
        backend: rlStatus.backend,
      },
      encryption: {
        algorithm: 'AES-256-GCM',
        configured: Boolean(process.env.ENCRYPTION_SECRET),
      },
      managementSecurity: {
        bindHost: process.env.MANAGEMENT_BIND_HOST || '127.0.0.1',
        port: parseInt(process.env.MANAGEMENT_PORT || '4001', 10),
        secretConfigured: Boolean(process.env.MANAGEMENT_API_SECRET),
        recommendation: 'Management API isolated to private interface on port 4001.',
      },
    });
  });
}
