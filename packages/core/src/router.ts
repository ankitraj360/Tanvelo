import {
  ChatCompletionRequest,
  ProviderExecutionResult,
  StreamingExecutionResult,
} from './adapters/types.js';
import { getProviderAdapter } from './adapters/index.js';
import { ErrorCategory, GatewayError } from './errors.js';

export interface RoutingRuleConfig {
  id: string;
  modelPattern: string;
  primaryProvider: string;
  primaryModel: string;
  secondaryProvider?: string | null;
  secondaryModel?: string | null;
  fallbackOnTimeout: boolean;
  fallbackOnRateLimit: boolean;
  fallbackOnError: boolean;
  timeoutMs: number;
  maxRetries: number;
  priority: number;
}

export interface ProviderConnectionConfig {
  provider: string;
  apiKey: string;
  apiBaseUrl?: string | null;
  status: string;
}

export interface AttemptLog {
  attemptNumber: number;
  provider: string;
  model: string;
  statusCode: number;
  latencyMs: number;
  isSuccess: boolean;
  errorCategory?: string;
  errorMessage?: string;
}

export interface ExecutionOutcome {
  result?: ProviderExecutionResult;
  streamingResult?: StreamingExecutionResult;
  finalProvider: string;
  finalModel: string;
  attempts: AttemptLog[];
}

export interface FallbackTarget {
  provider: string;
  model: string;
}

export interface ResolvedRoute {
  primaryProvider: string;
  primaryModel: string;
  secondaryProvider?: string | null;
  secondaryModel?: string | null;
  fallbackChain: FallbackTarget[];
  timeoutMs: number;
  maxRetries: number;
  fallbackOnTimeout: boolean;
  fallbackOnRateLimit: boolean;
  fallbackOnError: boolean;
}

function parseFallbackTarget(rawTarget: string): FallbackTarget {
  const trimmed = rawTarget.trim();
  if (trimmed.includes('/')) {
    const slashIdx = trimmed.indexOf('/');
    return {
      provider: trimmed.substring(0, slashIdx).toLowerCase(),
      model: trimmed.substring(slashIdx + 1),
    };
  }
  let inferredProvider = 'openai';
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('claude')) {
    inferredProvider = 'anthropic';
  } else if (lower.startsWith('gemini')) {
    inferredProvider = 'gemini';
  } else if (lower.startsWith('groq') || lower.startsWith('llama')) {
    inferredProvider = 'groq';
  } else if (lower.startsWith('deepseek')) {
    inferredProvider = 'deepseek';
  }
  return {
    provider: inferredProvider,
    model: trimmed,
  };
}

export class RoutingEngine {
  /**
   * Resolves provider and model targets given requested model and active rules
   */
  resolveRoute(
    requestedModel: string,
    rules: RoutingRuleConfig[],
    fallbacksHeader?: string | null
  ): ResolvedRoute {
    // Sort rules by priority descending
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);

    let resolvedPrimaryProvider = '';
    let resolvedPrimaryModel = '';
    let resolvedSecondaryProvider: string | null | undefined = null;
    let resolvedSecondaryModel: string | null | undefined = null;
    let timeoutMs = 30000;
    let maxRetries = 1;
    let fallbackOnTimeout = true;
    let fallbackOnRateLimit = true;
    let fallbackOnError = true;

    let matched = false;
    for (const rule of sorted) {
      if (this.matchPattern(rule.modelPattern, requestedModel)) {
        resolvedPrimaryProvider = rule.primaryProvider;
        resolvedPrimaryModel = rule.primaryModel === '*' ? requestedModel : rule.primaryModel;
        resolvedSecondaryProvider = rule.secondaryProvider;
        resolvedSecondaryModel = rule.secondaryModel;
        timeoutMs = rule.timeoutMs || 30000;
        maxRetries = Math.max(1, rule.maxRetries || 1);
        fallbackOnTimeout = rule.fallbackOnTimeout;
        fallbackOnRateLimit = rule.fallbackOnRateLimit;
        fallbackOnError = rule.fallbackOnError;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Default provider inference by model name if no rule matches
      let inferredProvider = 'openai';
      if (requestedModel.toLowerCase().startsWith('claude')) {
        inferredProvider = 'anthropic';
      } else if (requestedModel.toLowerCase().startsWith('gemini')) {
        inferredProvider = 'gemini';
      }
      resolvedPrimaryProvider = inferredProvider;
      resolvedPrimaryModel = requestedModel;
    }

    // Support X-Tanvelo-Fallbacks ordered fallback chain
    let fallbackChain: FallbackTarget[] = [];
    if (fallbacksHeader) {
      const parsed = fallbacksHeader
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (parsed.length > 0) {
        fallbackChain = parsed.map(parseFallbackTarget);
        resolvedSecondaryProvider = fallbackChain[0].provider;
        resolvedSecondaryModel = fallbackChain[0].model;
        fallbackOnTimeout = true;
        fallbackOnRateLimit = true;
        fallbackOnError = true;
      }
    } else if (resolvedSecondaryProvider && resolvedSecondaryModel) {
      fallbackChain = [
        {
          provider: resolvedSecondaryProvider,
          model: resolvedSecondaryModel,
        },
      ];
    }

    return {
      primaryProvider: resolvedPrimaryProvider,
      primaryModel: resolvedPrimaryModel,
      secondaryProvider: resolvedSecondaryProvider,
      secondaryModel: resolvedSecondaryModel,
      fallbackChain,
      timeoutMs,
      maxRetries,
      fallbackOnTimeout,
      fallbackOnRateLimit,
      fallbackOnError,
    };
  }

  private matchPattern(pattern: string, model: string): boolean {
    if (pattern === '*') return true;
    if (pattern === model) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return model.startsWith(prefix);
    }
    return false;
  }

  /**
   * Executes a standard non-streaming chat completion with deterministic routing & safe fallback chain
   */
  async executeChat(
    request: ChatCompletionRequest,
    rules: RoutingRuleConfig[],
    connections: Map<string, ProviderConnectionConfig>,
    fallbacksHeader?: string | null
  ): Promise<ExecutionOutcome> {
    const route = this.resolveRoute(request.model, rules, fallbacksHeader);
    const attempts: AttemptLog[] = [];

    // Stage 1: Try primary provider
    let shouldTryFallback = false;

    for (let pAttempt = 1; pAttempt <= route.maxRetries; pAttempt++) {
      const connection = connections.get(route.primaryProvider);
      if (!connection || connection.status !== 'connected' || !connection.apiKey) {
        const errorMsg = `Provider '${route.primaryProvider}' is not configured or connected for this project.`;
        attempts.push({
          attemptNumber: attempts.length + 1,
          provider: route.primaryProvider,
          model: route.primaryModel,
          statusCode: 503,
          latencyMs: 0,
          isSuccess: false,
          errorCategory: ErrorCategory.PROVIDER_UNAVAILABLE,
          errorMessage: errorMsg,
        });

        shouldTryFallback = route.fallbackChain.length > 0;
        if (!shouldTryFallback) {
          throw new GatewayError(errorMsg, ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
        }
        break;
      }

      const adapter = getProviderAdapter(route.primaryProvider, connection.apiBaseUrl);
      if (!adapter) {
        throw new GatewayError(
          `No adapter available for provider '${route.primaryProvider}'`,
          ErrorCategory.INTERNAL_GATEWAY_ERROR,
          500,
          undefined,
          undefined,
          [...attempts]
        );
      }

      try {
        const reqWithModel: ChatCompletionRequest = {
          ...request,
          model: route.primaryModel,
        };

        const result = await adapter.execute(
          reqWithModel,
          connection.apiKey,
          connection.apiBaseUrl,
          route.timeoutMs
        );

        attempts.push({
          attemptNumber: attempts.length + 1,
          provider: route.primaryProvider,
          model: route.primaryModel,
          statusCode: result.statusCode,
          latencyMs: result.latencyMs,
          isSuccess: true,
        });

        return {
          result,
          finalProvider: route.primaryProvider,
          finalModel: route.primaryModel,
          attempts,
        };
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        const category = err.category || ErrorCategory.INTERNAL_GATEWAY_ERROR;
        const latencyMs = err.originalError?.latencyMs || 100;

        attempts.push({
          attemptNumber: attempts.length + 1,
          provider: route.primaryProvider,
          model: route.primaryModel,
          statusCode,
          latencyMs,
          isSuccess: false,
          errorCategory: category,
          errorMessage: err.message,
        });

        // Determine if fallback is allowed
        const canFallback =
          route.fallbackChain.length > 0 &&
          ((category === ErrorCategory.TIMEOUT && route.fallbackOnTimeout) ||
            (category === ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_QUOTA_EXHAUSTED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_UNAVAILABLE && route.fallbackOnError) ||
            (statusCode >= 500 && route.fallbackOnError));

        if (canFallback) {
          shouldTryFallback = true;
          break;
        }

        if (pAttempt === route.maxRetries) {
          err.attempts = attempts;
          throw err;
        }
      }
    }

    // Stage 2: Fallback chain execution
    if (shouldTryFallback && route.fallbackChain.length > 0) {
      for (let fbIndex = 0; fbIndex < route.fallbackChain.length; fbIndex++) {
        const target = route.fallbackChain[fbIndex];
        const isLastTarget = fbIndex === route.fallbackChain.length - 1;
        const connection = connections.get(target.provider);

        if (!connection || connection.status !== 'connected' || !connection.apiKey) {
          const errorMsg = `Fallback provider '${target.provider}' is not configured or connected for this project.`;
          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode: 503,
            latencyMs: 0,
            isSuccess: false,
            errorCategory: ErrorCategory.PROVIDER_UNAVAILABLE,
            errorMessage: errorMsg,
          });

          if (isLastTarget) {
            throw new GatewayError(errorMsg, ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
          }
          continue;
        }

        const adapter = getProviderAdapter(target.provider, connection.apiBaseUrl);
        if (!adapter) {
          const errorMsg = `No adapter available for fallback provider '${target.provider}'`;
          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode: 500,
            latencyMs: 0,
            isSuccess: false,
            errorCategory: ErrorCategory.INTERNAL_GATEWAY_ERROR,
            errorMessage: errorMsg,
          });

          if (isLastTarget) {
            throw new GatewayError(errorMsg, ErrorCategory.INTERNAL_GATEWAY_ERROR, 500, undefined, undefined, [...attempts]);
          }
          continue;
        }

        try {
          const reqWithModel: ChatCompletionRequest = {
            ...request,
            model: target.model,
          };

          const result = await adapter.execute(
            reqWithModel,
            connection.apiKey,
            connection.apiBaseUrl,
            route.timeoutMs
          );

          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode: result.statusCode,
            latencyMs: result.latencyMs,
            isSuccess: true,
          });

          return {
            result,
            finalProvider: target.provider,
            finalModel: target.model,
            attempts,
          };
        } catch (err: any) {
          const statusCode = err.statusCode || 500;
          const category = err.category || ErrorCategory.INTERNAL_GATEWAY_ERROR;
          const latencyMs = err.originalError?.latencyMs || 100;

          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode,
            latencyMs,
            isSuccess: false,
            errorCategory: category,
            errorMessage: err.message,
          });

          const canContinueFallback =
            !isLastTarget &&
            ((category === ErrorCategory.TIMEOUT && route.fallbackOnTimeout) ||
              (category === ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED && route.fallbackOnRateLimit) ||
              (category === ErrorCategory.PROVIDER_QUOTA_EXHAUSTED && route.fallbackOnRateLimit) ||
              (category === ErrorCategory.PROVIDER_UNAVAILABLE && route.fallbackOnError) ||
              (statusCode >= 500 && route.fallbackOnError));

          if (canContinueFallback) {
            continue;
          }

          err.attempts = attempts;
          throw err;
        }
      }
    }

    throw new GatewayError('Exhausted all routing attempts', ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
  }

  /**
   * Executes a streaming chat completion with deterministic routing & safe fallback chain
   */
  async executeStreamChat(
    request: ChatCompletionRequest,
    rules: RoutingRuleConfig[],
    connections: Map<string, ProviderConnectionConfig>,
    fallbacksHeader?: string | null
  ): Promise<ExecutionOutcome> {
    const route = this.resolveRoute(request.model, rules, fallbacksHeader);
    const attempts: AttemptLog[] = [];

    let shouldTryFallback = false;

    // Stage 1: Try primary provider
    for (let pAttempt = 1; pAttempt <= route.maxRetries; pAttempt++) {
      const connection = connections.get(route.primaryProvider);
      if (!connection || connection.status !== 'connected' || !connection.apiKey) {
        const errorMsg = `Provider '${route.primaryProvider}' is not configured or connected for this project.`;
        attempts.push({
          attemptNumber: attempts.length + 1,
          provider: route.primaryProvider,
          model: route.primaryModel,
          statusCode: 503,
          latencyMs: 0,
          isSuccess: false,
          errorCategory: ErrorCategory.PROVIDER_UNAVAILABLE,
          errorMessage: errorMsg,
        });

        shouldTryFallback = route.fallbackChain.length > 0;
        if (!shouldTryFallback) {
          throw new GatewayError(errorMsg, ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
        }
        break;
      }

      const adapter = getProviderAdapter(route.primaryProvider, connection.apiBaseUrl);
      if (!adapter) {
        throw new GatewayError(
          `No adapter available for provider '${route.primaryProvider}'`,
          ErrorCategory.INTERNAL_GATEWAY_ERROR,
          500,
          undefined,
          undefined,
          [...attempts]
        );
      }

      try {
        const reqWithModel: ChatCompletionRequest = {
          ...request,
          model: route.primaryModel,
        };

        const streamingResult = await adapter.executeStream(
          reqWithModel,
          connection.apiKey,
          connection.apiBaseUrl,
          route.timeoutMs
        );

        attempts.push({
          attemptNumber: attempts.length + 1,
          provider: route.primaryProvider,
          model: route.primaryModel,
          statusCode: streamingResult.statusCode,
          latencyMs: streamingResult.latencyMs,
          isSuccess: true,
        });

        return {
          streamingResult,
          finalProvider: route.primaryProvider,
          finalModel: route.primaryModel,
          attempts,
        };
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        const category = err.category || ErrorCategory.INTERNAL_GATEWAY_ERROR;
        const latencyMs = 100;

        attempts.push({
          attemptNumber: attempts.length + 1,
          provider: route.primaryProvider,
          model: route.primaryModel,
          statusCode,
          latencyMs,
          isSuccess: false,
          errorCategory: category,
          errorMessage: err.message,
        });

        const canFallback =
          route.fallbackChain.length > 0 &&
          ((category === ErrorCategory.TIMEOUT && route.fallbackOnTimeout) ||
            (category === ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_QUOTA_EXHAUSTED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_UNAVAILABLE && route.fallbackOnError) ||
            (statusCode >= 500 && route.fallbackOnError));

        if (canFallback) {
          shouldTryFallback = true;
          break;
        }

        if (pAttempt === route.maxRetries) {
          err.attempts = attempts;
          throw err;
        }
      }
    }

    // Stage 2: Fallback chain execution
    if (shouldTryFallback && route.fallbackChain.length > 0) {
      for (let fbIndex = 0; fbIndex < route.fallbackChain.length; fbIndex++) {
        const target = route.fallbackChain[fbIndex];
        const isLastTarget = fbIndex === route.fallbackChain.length - 1;
        const connection = connections.get(target.provider);

        if (!connection || connection.status !== 'connected' || !connection.apiKey) {
          const errorMsg = `Fallback provider '${target.provider}' is not configured or connected for this project.`;
          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode: 503,
            latencyMs: 0,
            isSuccess: false,
            errorCategory: ErrorCategory.PROVIDER_UNAVAILABLE,
            errorMessage: errorMsg,
          });

          if (isLastTarget) {
            throw new GatewayError(errorMsg, ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
          }
          continue;
        }

        const adapter = getProviderAdapter(target.provider, connection.apiBaseUrl);
        if (!adapter) {
          const errorMsg = `No adapter available for fallback provider '${target.provider}'`;
          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode: 500,
            latencyMs: 0,
            isSuccess: false,
            errorCategory: ErrorCategory.INTERNAL_GATEWAY_ERROR,
            errorMessage: errorMsg,
          });

          if (isLastTarget) {
            throw new GatewayError(errorMsg, ErrorCategory.INTERNAL_GATEWAY_ERROR, 500, undefined, undefined, [...attempts]);
          }
          continue;
        }

        try {
          const reqWithModel: ChatCompletionRequest = {
            ...request,
            model: target.model,
          };

          const streamingResult = await adapter.executeStream(
            reqWithModel,
            connection.apiKey,
            connection.apiBaseUrl,
            route.timeoutMs
          );

          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode: streamingResult.statusCode,
            latencyMs: streamingResult.latencyMs,
            isSuccess: true,
          });

          return {
            streamingResult,
            finalProvider: target.provider,
            finalModel: target.model,
            attempts,
          };
        } catch (err: any) {
          const statusCode = err.statusCode || 500;
          const category = err.category || ErrorCategory.INTERNAL_GATEWAY_ERROR;
          const latencyMs = 100;

          attempts.push({
            attemptNumber: attempts.length + 1,
            provider: target.provider,
            model: target.model,
            statusCode,
            latencyMs,
            isSuccess: false,
            errorCategory: category,
            errorMessage: err.message,
          });

          const canContinueFallback =
            !isLastTarget &&
            ((category === ErrorCategory.TIMEOUT && route.fallbackOnTimeout) ||
              (category === ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED && route.fallbackOnRateLimit) ||
              (category === ErrorCategory.PROVIDER_QUOTA_EXHAUSTED && route.fallbackOnRateLimit) ||
              (category === ErrorCategory.PROVIDER_UNAVAILABLE && route.fallbackOnError) ||
              (statusCode >= 500 && route.fallbackOnError));

          if (canContinueFallback) {
            continue;
          }

          err.attempts = attempts;
          throw err;
        }
      }
    }

    throw new GatewayError('Exhausted all streaming routing attempts', ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
  }
}
