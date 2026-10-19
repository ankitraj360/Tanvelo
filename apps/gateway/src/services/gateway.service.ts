import crypto from 'crypto';
import { prisma } from '@tanvelo/db';
import {
  ChatCompletionRequest,
  decryptApiKey,
  ErrorCategory,
  GatewayError,
  hashGatewayKey,
  RateLimiter,
  RoutingEngine,
  calculateCost,
  sanitizePayload,
  sanitizeHeaders,
  dispatchWebhookWithRetries,
  WebhookPayload,
} from '@tanvelo/core';

const rateLimiter = new RateLimiter();
const routingEngine = new RoutingEngine();

export interface AuthenticatedContext {
  apiKeyId: string;
  projectId: string;
  environmentId: string;
  projectName: string;
  environmentName: string;
  keyPrefix: string;
}

export class GatewayService {
  /**
   * Authenticates the incoming Bearer token against stored API key hashes
   */
  async authenticateKey(authHeader?: string): Promise<AuthenticatedContext> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new GatewayError(
        'Missing or invalid Authorization header. Expected: Bearer YOUR_TANVELO_API_KEY',
        ErrorCategory.GATEWAY_KEY_REJECTED,
        401
      );
    }

    const rawKey = authHeader.slice(7).trim();
    if (!rawKey) {
      throw new GatewayError('Empty API key provided', ErrorCategory.GATEWAY_KEY_REJECTED, 401);
    }

    const keyHash = hashGatewayKey(rawKey);

    const apiKey = await prisma.gatewayApiKey.findUnique({
      where: { keyHash },
      include: {
        project: true,
        environment: true,
      },
    });

    if (!apiKey) {
      throw new GatewayError('Invalid Tanvelo API key', ErrorCategory.GATEWAY_KEY_REJECTED, 401);
    }

    if (apiKey.status !== 'active') {
      throw new GatewayError('Tanvelo API key has been revoked', ErrorCategory.GATEWAY_KEY_REJECTED, 403);
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new GatewayError('Tanvelo API key has expired', ErrorCategory.GATEWAY_KEY_REJECTED, 403);
    }

    // Update lastUsedAt in the background
    prisma.gatewayApiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return {
      apiKeyId: apiKey.id,
      projectId: apiKey.projectId,
      environmentId: apiKey.environmentId,
      projectName: apiKey.project.name,
      environmentName: apiKey.environment.name,
      keyPrefix: apiKey.keyPrefix,
    };
  }

  /**
   * Enforces distributed rate limits for the project/key with strict precedence:
   * Key-specific policy (rank 3) > Environment policy (rank 2) > Project-wide policy (rank 1)
   */
  async checkRateLimits(ctx: AuthenticatedContext) {
    const candidatePolicies = await prisma.rateLimitPolicy.findMany({
      where: {
        projectId: ctx.projectId,
        isEnabled: true,
        OR: [
          { keyId: ctx.apiKeyId },
          { environmentId: ctx.environmentId, keyId: null },
          { keyId: null, environmentId: null },
        ],
      },
    });

    // Rank policies: key-specific (rank 3) > environment-specific (rank 2) > project-wide (rank 1)
    const policy = candidatePolicies.sort((a, b) => {
      const getRank = (p: typeof a) => {
        if (p.keyId === ctx.apiKeyId) return 3;
        if (p.environmentId === ctx.environmentId && !p.keyId) return 2;
        return 1;
      };
      return getRank(b) - getRank(a);
    })[0];

    if (policy) {
      const result = await rateLimiter.checkRateLimit(`key:${ctx.apiKeyId}`, {
        requestsPerMinute: policy.requestsPerMinute,
        requestsPerHour: policy.requestsPerHour,
        requestsPerDay: policy.requestsPerDay,
        tokensPerMinute: policy.tokensPerMinute,
      });

      if (!result.allowed) {
        throw new GatewayError(
          result.errorMessage || 'Gateway rate limit exceeded',
          ErrorCategory.GATEWAY_RATE_LIMIT_EXCEEDED,
          429,
          undefined,
          undefined,
          undefined,
          {
            limit: result.limit,
            remaining: result.remaining,
            resetSeconds: result.resetSeconds,
          }
        );
      }

      return {
        limit: result.limit,
        remaining: result.remaining,
        resetSeconds: result.resetSeconds,
      };
    }

    return {
      limit: 1000,
      remaining: 999,
      resetSeconds: 60,
    };
  }

  /**
   * Checks if project budget hard limit is exceeded and performs period reset if due
   */
  async checkBudget(ctx: AuthenticatedContext) {
    const budget = await prisma.budget.findFirst({
      where: {
        projectId: ctx.projectId,
        OR: [{ environmentId: ctx.environmentId }, { environmentId: null }],
      },
    });

    if (budget) {
      // Check if period reset is due
      if (budget.resetAt && new Date() >= budget.resetAt) {
        const nextReset = this.calculateNextReset(budget.period);
        await prisma.budget.update({
          where: { id: budget.id },
          data: {
            currentSpendUsd: 0,
            resetAt: nextReset,
          },
        });
        budget.currentSpendUsd = 0;
        budget.resetAt = nextReset;
      }

      if (budget.hardLimitEnabled && budget.currentSpendUsd >= budget.maxBudgetUsd) {
        throw new GatewayError(
          `Project budget hard limit reached ($${budget.currentSpendUsd.toFixed(2)} / $${budget.maxBudgetUsd.toFixed(2)}). Gateway requests are blocked.`,
          ErrorCategory.BUDGET_EXCEEDED,
          429
        );
      }
    }
  }

  private calculateNextReset(period: string): Date {
    const d = new Date();
    if (period === 'daily') {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
    } else {
      // monthly
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    }
    return d;
  }

  /**
   * Fetches decrypted provider connections and routing rules
   */
  async getRoutingContext(ctx: AuthenticatedContext) {
    const [rules, connections, modelConfigs] = await Promise.all([
      prisma.routingRule.findMany({
        where: {
          projectId: ctx.projectId,
          environmentId: ctx.environmentId,
          isEnabled: true,
        },
      }),
      prisma.providerConnection.findMany({
        where: { projectId: ctx.projectId },
      }),
      prisma.modelConfig.findMany({
        where: { projectId: ctx.projectId },
      }),
    ]);

    const connectionMap = new Map();
    for (const conn of connections) {
      let decryptedKey = '';
      if (conn.apiKeyEncrypted) {
        try {
          decryptedKey = decryptApiKey(conn.apiKeyEncrypted);
        } catch (_) {}
      }
      connectionMap.set(conn.provider, {
        provider: conn.provider,
        apiKey: decryptedKey,
        apiBaseUrl: conn.apiBaseUrl,
        status: conn.status,
      });
    }

    const pricingMap = new Map<string, { inputPricePerMillion: number; outputPricePerMillion: number }>();
    for (const m of modelConfigs) {
      pricingMap.set(m.modelId, {
        inputPricePerMillion: m.inputPricePerMillion,
        outputPricePerMillion: m.outputPricePerMillion,
      });
    }

    return {
      rules,
      connectionMap,
      pricingMap,
    };
  }

  /**
   * Persists request log, attempts, token usage, and atomically updates budget spend
   */
  async recordRequest(params: {
    requestId: string;
    ctx: AuthenticatedContext;
    provider: string;
    model: string;
    statusCode: number;
    status: 'success' | 'error' | 'rate_limited' | 'budget_exceeded' | 'fallback_success';
    totalLatencyMs: number;
    providerLatencyMs: number;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    pricing?: { inputPricePerMillion: number; outputPricePerMillion: number };
    errorCategory?: ErrorCategory;
    errorMessage?: string;
    requestBody?: any;
    responseBody?: any;
    requestHeaders?: any;
    attempts?: any[];
    clientIp?: string;
    userAgent?: string;
  }) {
    try {
      const costCalc = calculateCost(params.usage, params.pricing);

      // Create gateway request record
      const gatewayReq = await prisma.gatewayRequest.create({
        data: {
          requestId: params.requestId,
          projectId: params.ctx.projectId,
          environmentId: params.ctx.environmentId,
          keyId: params.ctx.apiKeyId,
          provider: params.provider,
          model: params.model,
          statusCode: params.statusCode,
          status: params.status,
          totalLatencyMs: params.totalLatencyMs,
          providerLatencyMs: params.providerLatencyMs,
          inputTokens: params.usage?.promptTokens || 0,
          outputTokens: params.usage?.completionTokens || 0,
          totalTokens: params.usage?.totalTokens || 0,
          estimatedCost: costCalc.estimatedCost,
          errorCategory: params.errorCategory,
          errorMessage: params.errorMessage,
          requestBodySanitized: params.requestBody ? (sanitizePayload(params.requestBody) as any) : undefined,
          responseBodySanitized: params.responseBody ? (sanitizePayload(params.responseBody) as any) : undefined,
          clientIp: params.clientIp,
          userAgent: params.userAgent,
          attempts: {
            create: (params.attempts || []).map((a) => ({
              requestId: params.requestId,
              provider: a.provider,
              model: a.model,
              attemptNumber: a.attemptNumber,
              statusCode: a.statusCode,
              latencyMs: a.latencyMs,
              isSuccess: a.isSuccess,
              errorCategory: a.errorCategory,
              errorMessage: a.errorMessage,
            })),
          },
        },
      });

      // Record token usage for tokensPerMinute rate limiting
      if (params.usage?.totalTokens) {
        rateLimiter.recordTokenUsage(`key:${params.ctx.apiKeyId}`, params.usage.totalTokens).catch(() => {});
      }

      // Record usage records and atomically increment budget spend
      if (params.usage && params.status === 'success') {
        await prisma.usageRecord.create({
          data: {
            projectId: params.ctx.projectId,
            environmentId: params.ctx.environmentId,
            keyId: params.ctx.apiKeyId,
            provider: params.provider,
            model: params.model,
            inputTokens: params.usage.promptTokens,
            outputTokens: params.usage.completionTokens,
            totalTokens: params.usage.totalTokens,
            cost: costCalc.estimatedCost,
          },
        });

        // Atomically update budget spend using Prisma increment
        if (costCalc.estimatedCost > 0) {
          const budget = await prisma.budget.findFirst({
            where: {
              projectId: params.ctx.projectId,
              OR: [{ environmentId: params.ctx.environmentId }, { environmentId: null }],
            },
          });

          if (budget) {
            // Check if period reset is due
            if (budget.resetAt && new Date() >= budget.resetAt) {
              const nextReset = this.calculateNextReset(budget.period);
              await prisma.budget.update({
                where: { id: budget.id },
                data: {
                  currentSpendUsd: 0,
                  resetAt: nextReset,
                },
              });
            }

            // Atomic increment prevents race conditions under high concurrency
            const updatedBudget = await prisma.budget.update({
              where: { id: budget.id },
              data: {
                currentSpendUsd: { increment: costCalc.estimatedCost },
              },
            });

            const newSpend = updatedBudget.currentSpendUsd;
            const percentUsed = (newSpend / budget.maxBudgetUsd) * 100;
            if (percentUsed >= budget.warningThresholdPercent && percentUsed < 100) {
              await prisma.alert.create({
                data: {
                  projectId: params.ctx.projectId,
                  environmentId: params.ctx.environmentId,
                  alertType: 'budget_warning',
                  title: 'Budget warning threshold reached',
                  message: `Project spend is at ${percentUsed.toFixed(1)}% ($${newSpend.toFixed(2)} / $${budget.maxBudgetUsd.toFixed(2)})`,
                  severity: 'warning',
                },
              });
              this.triggerWebhooks(params.ctx.projectId, 'budget.warning', {
                currentSpend: newSpend,
                maxBudget: budget.maxBudgetUsd,
                percentUsed,
              });
            } else if (newSpend >= budget.maxBudgetUsd) {
              await prisma.alert.create({
                data: {
                  projectId: params.ctx.projectId,
                  environmentId: params.ctx.environmentId,
                  alertType: 'budget_exceeded',
                  title: 'Budget limit exceeded',
                  message: `Project spend has exceeded budget ($${newSpend.toFixed(2)} / $${budget.maxBudgetUsd.toFixed(2)})`,
                  severity: 'critical',
                },
              });
              this.triggerWebhooks(params.ctx.projectId, 'budget.exceeded', {
                currentSpend: newSpend,
                maxBudget: budget.maxBudgetUsd,
              });
            }
          }
        }
      }

      // If request failed, check for failure alerts & webhooks
      if (params.status === 'error') {
        if (
          params.errorCategory === ErrorCategory.PROVIDER_UNAVAILABLE ||
          params.statusCode === 502 ||
          params.statusCode === 503
        ) {
          this.triggerWebhooks(params.ctx.projectId, 'provider.unavailable', {
            requestId: params.requestId,
            provider: params.provider,
            model: params.model,
            errorMessage: params.errorMessage,
          });
        }

        this.triggerWebhooks(params.ctx.projectId, 'request.failed', {
          requestId: params.requestId,
          errorCategory: params.errorCategory,
          errorMessage: params.errorMessage,
          model: params.model,
          provider: params.provider,
        });
      }

      return gatewayReq;
    } catch (e) {
      console.error('Failed to record gateway request:', e);
    }
  }

  /**
   * Dispatches webhooks asynchronously with retry scheduling and delivery logging
   */
  async triggerWebhooks(projectId: string, eventName: string, data: any) {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { projectId, isEnabled: true },
      });

      for (const wh of webhooks) {
        if (wh.events.includes('*') || wh.events.includes(eventName)) {
          const payload: WebhookPayload = {
            id: `evt_${crypto.randomUUID()}`,
            event: eventName,
            timestamp: new Date().toISOString(),
            data,
          };

          dispatchWebhookWithRetries(wh.url, wh.secret, payload, 3)
            .then(async (attempts) => {
              for (const res of attempts) {
                await prisma.webhookDelivery.create({
                  data: {
                    webhookId: wh.id,
                    eventType: eventName,
                    payload: payload as any,
                    statusCode: res.statusCode,
                    responseBody: res.responseBody,
                    attemptNumber: res.attemptNumber,
                    isSuccess: res.isSuccess,
                    errorMessage: res.errorMessage,
                  },
                });
              }
            })
            .catch(() => {});
        }
      }
    } catch (_) {}
  }

  getRoutingEngine() {
    return routingEngine;
  }

  getRateLimiter() {
    return rateLimiter;
  }

  async close(): Promise<void> {
    if (rateLimiter && typeof (rateLimiter as any).close === 'function') {
      await (rateLimiter as any).close();
    }
  }
}

export const gatewayService = new GatewayService();
