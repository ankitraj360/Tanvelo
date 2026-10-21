import crypto from 'crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GatewayService } from '../services/gateway.service.js';
import { ErrorCategory, GatewayError, calculateCost } from '@tanvelo/core';
import { prisma } from '@tanvelo/db';

const gatewayService = new GatewayService();

export async function gatewayRoutes(fastify: FastifyInstance) {
  // Root welcome / status endpoint
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      service: 'Tanvelo LLM Federation Gateway',
      status: 'operational',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        chatCompletions: '/v1/chat/completions',
        models: '/v1/models',
        documentation: 'https://www.tanvelo.in/docs',
      },
    });
  });

  // Liveness check (process is alive)
  fastify.get('/health/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ status: 'alive' });
  });

  // Readiness check (DB connection active)
  fastify.get('/health/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({ status: 'ready', database: 'ok' });
    } catch (err: any) {
      return reply.status(503).send({ status: 'unready', database: `error: ${err.message}` });
    }
  });

  // Comprehensive Health check endpoint
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    const rateLimiterStatus = gatewayService.getRateLimiter().getStatus();
    const isDbOk = dbStatus === 'ok';
    const isRedisOk = rateLimiterStatus.distributed;

    const overallStatus = !isDbOk ? 'unhealthy' : !isRedisOk ? 'degraded' : 'healthy';
    const statusCode = isDbOk ? 200 : 503;

    return reply.status(statusCode).send({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'tanvelo-llm-gateway',
      version: '1.0.0',
      database: dbStatus,
      redis: isRedisOk ? 'ok' : 'degraded (in-memory fallback)',
      rateLimiter: rateLimiterStatus,
    });
  });

  // GET /v1/models (OpenAI format)
  fastify.get('/v1/models', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    const ctx = await gatewayService.authenticateKey(authHeader);

    // Permission scope check
    if (
      ctx.permissions &&
      Array.isArray(ctx.permissions) &&
      !ctx.permissions.includes('models:read') &&
      !ctx.permissions.includes('models:list') &&
      !ctx.permissions.includes('chat:completions') &&
      !ctx.permissions.includes('*')
    ) {
      const gErr = new GatewayError(
        'Forbidden: API key does not have permission to list models.',
        ErrorCategory.GATEWAY_KEY_REJECTED,
        403
      );
      return reply.status(403).send(gErr.toResponse());
    }

    const models = await prisma.modelConfig.findMany({
      where: { projectId: ctx.projectId, isEnabled: true },
    });

    return reply.send({
      object: 'list',
      data: models.map((m) => ({
        id: m.modelId,
        object: 'model',
        created: Math.floor(m.createdAt.getTime() / 1000),
        owned_by: m.provider,
        permission: [],
        root: m.modelId,
        parent: null,
      })),
    });
  });

  // POST /v1/chat/completions (OpenAI format)
  fastify.post('/v1/chat/completions', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const requestId = `req_${crypto.randomUUID()}`;
    const clientIp = request.ip;
    const userAgent = request.headers['user-agent'] as string;

    let ctx;
    try {
      ctx = await gatewayService.authenticateKey(request.headers.authorization);
    } catch (err: any) {
      const gErr = err instanceof GatewayError ? err : new GatewayError(err.message, ErrorCategory.GATEWAY_KEY_REJECTED, 401);
      return reply.status(gErr.statusCode).send(gErr.toResponse());
    }

    // Permission scope check (Item 17)
    if (
      ctx.permissions &&
      Array.isArray(ctx.permissions) &&
      !ctx.permissions.includes('chat:completions') &&
      !ctx.permissions.includes('*')
    ) {
      const gErr = new GatewayError(
        'Forbidden: API key does not have required "chat:completions" permission scope.',
        ErrorCategory.GATEWAY_KEY_REJECTED,
        403
      );
      return reply.status(403).send(gErr.toResponse());
    }

    // Rate limit check
    try {
      const rl = await gatewayService.checkRateLimits(ctx);
      reply.header('X-RateLimit-Limit', rl.limit);
      reply.header('X-RateLimit-Remaining', rl.remaining);
      reply.header('X-RateLimit-Reset', rl.resetSeconds);
    } catch (err: any) {
      const gErr = err instanceof GatewayError ? err : new GatewayError(err.message, ErrorCategory.GATEWAY_RATE_LIMIT_EXCEEDED, 429);

      // Set X-RateLimit-* and Retry-After headers on 429 response
      const rlInfo = gErr.rateLimitInfo || { limit: 0, remaining: 0, resetSeconds: 60 };
      reply.header('X-RateLimit-Limit', rlInfo.limit);
      reply.header('X-RateLimit-Remaining', rlInfo.remaining);
      reply.header('X-RateLimit-Reset', rlInfo.resetSeconds);
      reply.header('Retry-After', String(rlInfo.resetSeconds || 60));

      // Trigger rate_limit.exceeded webhook
      gatewayService.triggerWebhooks(ctx.projectId, 'rate_limit.exceeded', {
        requestId,
        keyId: ctx.apiKeyId,
        limit: rlInfo.limit,
        resetSeconds: rlInfo.resetSeconds,
      });

      // Record rate limit error
      await gatewayService.recordRequest({
        requestId,
        ctx,
        provider: 'gateway',
        model: (request.body as any)?.model || 'unknown',
        statusCode: 429,
        status: 'rate_limited',
        totalLatencyMs: Date.now() - startTime,
        providerLatencyMs: 0,
        errorCategory: gErr.category,
        errorMessage: gErr.message,
        requestBody: request.body,
        attempts: [],
        clientIp,
        userAgent,
      });

      return reply.status(429).send(gErr.toResponse());
    }

    // Budget check
    try {
      await gatewayService.checkBudget(ctx);
    } catch (err: any) {
      const gErr = err instanceof GatewayError ? err : new GatewayError(err.message, ErrorCategory.BUDGET_EXCEEDED, 429);
      await gatewayService.recordRequest({
        requestId,
        ctx,
        provider: 'gateway',
        model: (request.body as any)?.model || 'unknown',
        statusCode: 429,
        status: 'budget_exceeded',
        totalLatencyMs: Date.now() - startTime,
        providerLatencyMs: 0,
        errorCategory: gErr.category,
        errorMessage: gErr.message,
        requestBody: request.body,
        attempts: [],
        clientIp,
        userAgent,
      });

      // Emit budget.exceeded webhook on hard limit block
      gatewayService.triggerWebhooks(ctx.projectId, 'budget.exceeded', {
        requestId,
        keyId: ctx.apiKeyId,
        errorCategory: gErr.category,
        errorMessage: gErr.message,
      });

      // Create budget exceeded alert (deduplicated by checking last 60 seconds)
      const existingAlert = await prisma.alert.findFirst({
        where: {
          projectId: ctx.projectId,
          alertType: 'budget_exceeded',
          createdAt: { gte: new Date(Date.now() - 60000) },
        },
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            projectId: ctx.projectId,
            environmentId: ctx.environmentId,
            alertType: 'budget_exceeded',
            title: 'Budget hard limit exceeded',
            message: gErr.message,
            severity: 'critical',
          },
        }).catch(() => {});
      }

      return reply.status(429).send(gErr.toResponse());
    }

    const body = request.body as any;
    if (!body || !body.model || !body.messages || !Array.isArray(body.messages)) {
      const gErr = new GatewayError(
        'Invalid request body. "model" and "messages" array are required.',
        ErrorCategory.INVALID_REQUEST,
        400
      );
      return reply.status(400).send(gErr.toResponse());
    }

    // Model enabled check (Item 8)
    const configuredModel = await prisma.modelConfig.findFirst({
      where: { projectId: ctx.projectId, modelId: body.model },
    });
    if (configuredModel && !configuredModel.isEnabled) {
      const gErr = new GatewayError(
        `Model '${body.model}' is disabled for this project.`,
        ErrorCategory.UNSUPPORTED_MODEL,
        400
      );
      return reply.status(400).send(gErr.toResponse());
    }

    const fallbacksHeader = (request.headers['x-tanvelo-fallbacks'] as string) || null;
    const { rules, connectionMap, pricingMap } = await gatewayService.getRoutingContext(ctx);
    const routingEngine = gatewayService.getRoutingEngine();

    if (body.stream) {
      // Streaming execution
      try {
        const outcome = await routingEngine.executeStreamChat(body, rules as any, connectionMap, fallbacksHeader);
        const pricing = pricingMap.get(outcome.finalModel);

        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Tanvelo-Request-Id': requestId,
          'X-Tanvelo-Provider': outcome.finalProvider,
          'X-Tanvelo-Model': outcome.finalModel,
        });

        const reader = outcome.streamingResult!.stream.getReader();
        const textChunks: string[] = [];

        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              reply.raw.write(value);

              // Extract text for log sampling
              const str = Buffer.from(value).toString('utf-8');
              textChunks.push(str);
            }
          } catch (streamErr) {
            console.error('Error during stream chunk forwarding:', streamErr);
          } finally {
            reply.raw.end();
            const totalLatency = Date.now() - startTime;
            const usage = outcome.streamingResult!.getUsage?.() || undefined;

            await gatewayService.recordRequest({
              requestId,
              ctx,
              provider: outcome.finalProvider,
              model: outcome.finalModel,
              statusCode: outcome.streamingResult!.statusCode,
              status: 'success',
              totalLatencyMs: totalLatency,
              providerLatencyMs: outcome.streamingResult!.latencyMs,
              usage,
              pricing,
              requestBody: body,
              responseBody: { streamCompleted: true, chunkCount: textChunks.length },
              attempts: outcome.attempts,
              clientIp,
              userAgent,
            });
          }
        })();

        return;
      } catch (err: any) {
        const totalLatency = Date.now() - startTime;
        const gErr = err instanceof GatewayError ? err : new GatewayError(err.message, ErrorCategory.INTERNAL_GATEWAY_ERROR, 500);

        const lastAttempt = err.attempts && err.attempts.length > 0 ? err.attempts[err.attempts.length - 1] : null;
        const errProvider = lastAttempt?.provider || (body.model?.includes('/') ? body.model.split('/')[0] : 'unknown');
        const errModel = lastAttempt?.model || body.model || 'unknown';

        await gatewayService.recordRequest({
          requestId,
          ctx,
          provider: errProvider,
          model: errModel,
          statusCode: gErr.statusCode,
          status: 'error',
          totalLatencyMs: totalLatency,
          providerLatencyMs: 0,
          errorCategory: gErr.category,
          errorMessage: gErr.message,
          requestBody: body,
          attempts: err.attempts || [],
          clientIp,
          userAgent,
        });

        return reply.status(gErr.statusCode).send(gErr.toResponse());
      }
    } else {
      // Non-streaming execution
      try {
        const outcome = await routingEngine.executeChat(body, rules as any, connectionMap, fallbacksHeader);
        const totalLatency = Date.now() - startTime;
        const pricing = pricingMap.get(outcome.finalModel);

        await gatewayService.recordRequest({
          requestId,
          ctx,
          provider: outcome.finalProvider,
          model: outcome.finalModel,
          statusCode: outcome.result!.statusCode,
          status: 'success',
          totalLatencyMs: totalLatency,
          providerLatencyMs: outcome.result!.latencyMs,
          usage: outcome.result!.usage,
          pricing,
          requestBody: body,
          responseBody: outcome.result!.response,
          attempts: outcome.attempts,
          clientIp,
          userAgent,
        });

        reply.header('X-Tanvelo-Request-Id', requestId);
        reply.header('X-Tanvelo-Provider', outcome.finalProvider);
        reply.header('X-Tanvelo-Model', outcome.finalModel);
        reply.header('X-Tanvelo-Latency-Ms', String(totalLatency));

        if (pricing && outcome.result?.usage) {
          const costCalc = calculateCost(outcome.result.usage, pricing);
          reply.header('X-Tanvelo-Cost-Usd', String(costCalc.estimatedCost.toFixed(6)));
        }

        return reply.status(outcome.result!.statusCode).send(outcome.result!.response);
      } catch (err: any) {
        const totalLatency = Date.now() - startTime;
        const gErr = err instanceof GatewayError ? err : new GatewayError(err.message, ErrorCategory.INTERNAL_GATEWAY_ERROR, 500);

        const lastAttempt = err.attempts && err.attempts.length > 0 ? err.attempts[err.attempts.length - 1] : null;
        const errProvider = lastAttempt?.provider || (body.model?.includes('/') ? body.model.split('/')[0] : 'unknown');
        const errModel = lastAttempt?.model || body.model || 'unknown';

        await gatewayService.recordRequest({
          requestId,
          ctx,
          provider: errProvider,
          model: errModel,
          statusCode: gErr.statusCode,
          status: 'error',
          totalLatencyMs: totalLatency,
          providerLatencyMs: 0,
          errorCategory: gErr.category,
          errorMessage: gErr.message,
          requestBody: body,
          attempts: err.attempts || [],
          clientIp,
          userAgent,
        });

        return reply.status(gErr.statusCode).send(gErr.toResponse());
      }
    }
  });
}
