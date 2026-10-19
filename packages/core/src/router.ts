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

export class RoutingEngine {
  /**
   * Resolves provider and model targets given requested model and active rules
   */
  resolveRoute(
    requestedModel: string,
    rules: RoutingRuleConfig[]
  ): {
    primaryProvider: string;
    primaryModel: string;
    secondaryProvider?: string | null;
    secondaryModel?: string | null;
    timeoutMs: number;
    maxRetries: number;
    fallbackOnTimeout: boolean;
    fallbackOnRateLimit: boolean;
    fallbackOnError: boolean;
  } {
    // Sort rules by priority descending
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sorted) {
      if (this.matchPattern(rule.modelPattern, requestedModel)) {
        return {
          primaryProvider: rule.primaryProvider,
          primaryModel: rule.primaryModel === '*' ? requestedModel : rule.primaryModel,
          secondaryProvider: rule.secondaryProvider,
          secondaryModel: rule.secondaryModel,
          timeoutMs: rule.timeoutMs || 30000,
          maxRetries: rule.maxRetries || 1,
          fallbackOnTimeout: rule.fallbackOnTimeout,
          fallbackOnRateLimit: rule.fallbackOnRateLimit,
          fallbackOnError: rule.fallbackOnError,
        };
      }
    }

    // Default provider inference by model name if no rule matches
    let inferredProvider = 'openai';
    if (requestedModel.toLowerCase().startsWith('claude')) {
      inferredProvider = 'anthropic';
    } else if (requestedModel.toLowerCase().startsWith('gemini')) {
      inferredProvider = 'gemini';
    }

    return {
      primaryProvider: inferredProvider,
      primaryModel: requestedModel,
      timeoutMs: 30000,
      maxRetries: 1,
      fallbackOnTimeout: true,
      fallbackOnRateLimit: true,
      fallbackOnError: true,
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
   * Executes a standard non-streaming chat completion with deterministic routing & safe fallback
   */
  async executeChat(
    request: ChatCompletionRequest,
    rules: RoutingRuleConfig[],
    connections: Map<string, ProviderConnectionConfig>
  ): Promise<ExecutionOutcome> {
    const route = this.resolveRoute(request.model, rules);
    const attempts: AttemptLog[] = [];

    // Attempt 1: Primary provider
    let currentProvider = route.primaryProvider;
    let currentModel = route.primaryModel;
    let attemptNum = 1;

    while (attemptNum <= (route.maxRetries || 2)) {
      const connection = connections.get(currentProvider);
      if (!connection || connection.status !== 'connected' || !connection.apiKey) {
        const errorMsg = `Provider '${currentProvider}' is not configured or connected for this project.`;
        attempts.push({
          attemptNumber: attemptNum,
          provider: currentProvider,
          model: currentModel,
          statusCode: 503,
          latencyMs: 0,
          isSuccess: false,
          errorCategory: ErrorCategory.PROVIDER_UNAVAILABLE,
          errorMessage: errorMsg,
        });

        // Check if secondary is available
        if (
          attemptNum === 1 &&
          route.secondaryProvider &&
          route.secondaryModel &&
          route.secondaryProvider !== currentProvider
        ) {
          currentProvider = route.secondaryProvider;
          currentModel = route.secondaryModel;
          attemptNum++;
          continue;
        }

        throw new GatewayError(errorMsg, ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
      }

      const adapter = getProviderAdapter(currentProvider, connection.apiBaseUrl);
      if (!adapter) {
        throw new GatewayError(
          `No adapter available for provider '${currentProvider}'`,
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
          model: currentModel,
        };

        const result = await adapter.execute(
          reqWithModel,
          connection.apiKey,
          connection.apiBaseUrl,
          route.timeoutMs
        );

        attempts.push({
          attemptNumber: attemptNum,
          provider: currentProvider,
          model: currentModel,
          statusCode: result.statusCode,
          latencyMs: result.latencyMs,
          isSuccess: true,
        });

        return {
          result,
          finalProvider: currentProvider,
          finalModel: currentModel,
          attempts,
        };
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        const category = err.category || ErrorCategory.INTERNAL_GATEWAY_ERROR;
        const latencyMs = err.originalError?.latencyMs || 100;

        attempts.push({
          attemptNumber: attemptNum,
          provider: currentProvider,
          model: currentModel,
          statusCode,
          latencyMs,
          isSuccess: false,
          errorCategory: category,
          errorMessage: err.message,
        });

        // Determine if fallback is allowed
        const canFallback =
          attemptNum === 1 &&
          route.secondaryProvider &&
          route.secondaryModel &&
          ((category === ErrorCategory.TIMEOUT && route.fallbackOnTimeout) ||
            (category === ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_QUOTA_EXHAUSTED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_UNAVAILABLE && route.fallbackOnError) ||
            (statusCode >= 500 && route.fallbackOnError));

        if (canFallback) {
          currentProvider = route.secondaryProvider!;
          currentModel = route.secondaryModel!;
          attemptNum++;
          continue;
        }

        // Rethrow original error with attempt logs attached
        err.attempts = attempts;
        throw err;
      }
    }

    throw new GatewayError('Exhausted all routing attempts', ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
  }

  /**
   * Executes a streaming chat completion with deterministic routing & safe fallback
   */
  async executeStreamChat(
    request: ChatCompletionRequest,
    rules: RoutingRuleConfig[],
    connections: Map<string, ProviderConnectionConfig>
  ): Promise<ExecutionOutcome> {
    const route = this.resolveRoute(request.model, rules);
    const attempts: AttemptLog[] = [];

    let currentProvider = route.primaryProvider;
    let currentModel = route.primaryModel;
    let attemptNum = 1;

    while (attemptNum <= (route.maxRetries || 2)) {
      const connection = connections.get(currentProvider);
      if (!connection || connection.status !== 'connected' || !connection.apiKey) {
        const errorMsg = `Provider '${currentProvider}' is not configured or connected for this project.`;
        attempts.push({
          attemptNumber: attemptNum,
          provider: currentProvider,
          model: currentModel,
          statusCode: 503,
          latencyMs: 0,
          isSuccess: false,
          errorCategory: ErrorCategory.PROVIDER_UNAVAILABLE,
          errorMessage: errorMsg,
        });

        if (
          attemptNum === 1 &&
          route.secondaryProvider &&
          route.secondaryModel &&
          route.secondaryProvider !== currentProvider
        ) {
          currentProvider = route.secondaryProvider;
          currentModel = route.secondaryModel;
          attemptNum++;
          continue;
        }

        throw new GatewayError(errorMsg, ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
      }

      const adapter = getProviderAdapter(currentProvider, connection.apiBaseUrl);
      if (!adapter) {
        throw new GatewayError(
          `No adapter available for provider '${currentProvider}'`,
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
          model: currentModel,
        };

        const streamingResult = await adapter.executeStream(
          reqWithModel,
          connection.apiKey,
          connection.apiBaseUrl,
          route.timeoutMs
        );

        attempts.push({
          attemptNumber: attemptNum,
          provider: currentProvider,
          model: currentModel,
          statusCode: streamingResult.statusCode,
          latencyMs: streamingResult.latencyMs,
          isSuccess: true,
        });

        return {
          streamingResult,
          finalProvider: currentProvider,
          finalModel: currentModel,
          attempts,
        };
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        const category = err.category || ErrorCategory.INTERNAL_GATEWAY_ERROR;
        const latencyMs = 100;

        attempts.push({
          attemptNumber: attemptNum,
          provider: currentProvider,
          model: currentModel,
          statusCode,
          latencyMs,
          isSuccess: false,
          errorCategory: category,
          errorMessage: err.message,
        });

        const canFallback =
          attemptNum === 1 &&
          route.secondaryProvider &&
          route.secondaryModel &&
          ((category === ErrorCategory.TIMEOUT && route.fallbackOnTimeout) ||
            (category === ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_QUOTA_EXHAUSTED && route.fallbackOnRateLimit) ||
            (category === ErrorCategory.PROVIDER_UNAVAILABLE && route.fallbackOnError) ||
            (statusCode >= 500 && route.fallbackOnError));

        if (canFallback) {
          currentProvider = route.secondaryProvider!;
          currentModel = route.secondaryModel!;
          attemptNum++;
          continue;
        }

        err.attempts = attempts;
        throw err;
      }
    }

    throw new GatewayError('Exhausted all streaming routing attempts', ErrorCategory.PROVIDER_UNAVAILABLE, 503, undefined, undefined, [...attempts]);
  }
}
