import {
  ChatCompletionRequest,
  ProviderExecutionResult,
  StreamingExecutionResult,
} from './adapters/types.js';
import { getProviderAdapter } from './adapters/index.js';
import { ErrorCategory, GatewayError } from './errors.js';
import {
  PROVIDER_CATALOG,
  PROVIDER_ALIASES,
  isKnownProvider,
} from './providers/catalog.js';

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

const CATALOG_PROVIDER_IDS = new Set<string>([
  ...PROVIDER_CATALOG.map((p) => p.id.toLowerCase()),
  ...Object.keys(PROVIDER_ALIASES).map((a) => a.toLowerCase()),
  'openai',
  'anthropic',
  'gemini',
  'google',
  'groq',
  'deepseek',
  'mistral',
  'openrouter',
  'cohere',
  'ollama',
]);

export function isKnownGatewayProvider(
  prefix: string,
  connections?: Map<string, ProviderConnectionConfig>
): boolean {
  if (!prefix) return false;
  const norm = prefix.toLowerCase().trim();
  if (CATALOG_PROVIDER_IDS.has(norm) || isKnownProvider(norm)) return true;
  if (connections?.has(norm) || connections?.has(prefix)) return true;
  if (connections) {
    for (const key of connections.keys()) {
      if (key.toLowerCase() === norm) return true;
    }
  }
  return false;
}

export function resolveCanonicalProvider(prefix: string): string {
  const norm = prefix.toLowerCase().trim();
  const canonical = PROVIDER_ALIASES[norm] || norm;
  return canonical === 'google' ? 'gemini' : canonical;
}

export function parseFallbackTarget(
  rawTarget: string,
  connections?: Map<string, ProviderConnectionConfig>,
  modelConfigs?: Array<{ modelId: string; provider: string }>
): FallbackTarget {
  const trimmed = rawTarget.trim();

  // 1. Explicit provider prefix, e.g. "cerebras/llama3.1-70b" or "openrouter:nemotron"
  if (trimmed.includes(':') && !trimmed.startsWith('http')) {
    const colonIdx = trimmed.indexOf(':');
    const prefix = trimmed.substring(0, colonIdx).toLowerCase();
    const rest = trimmed.substring(colonIdx + 1);
    if (isKnownGatewayProvider(prefix, connections)) {
      return {
        provider: resolveCanonicalProvider(prefix),
        model: rest,
      };
    }
  }

  if (trimmed.includes('/')) {
    const slashIdx = trimmed.indexOf('/');
    const prefix = trimmed.substring(0, slashIdx).toLowerCase();
    const rest = trimmed.substring(slashIdx + 1);
    if (isKnownGatewayProvider(prefix, connections)) {
      return {
        provider: resolveCanonicalProvider(prefix),
        model: rest,
      };
    }
    // If it looks like an OpenRouter vendor path (e.g. "nvidia/...", "meta-llama/...") and openrouter is connected
    if (connections?.get('openrouter')?.status === 'connected') {
      return {
        provider: 'openrouter',
        model: trimmed,
      };
    }
  }

  // 2. Check modelConfigs for project
  if (modelConfigs && Array.isArray(modelConfigs)) {
    const found = modelConfigs.find(
      (m) => m.modelId === trimmed || m.modelId.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      return {
        provider: found.provider,
        model: found.modelId,
      };
    }
  }

  // 3. Known model heuristics
  const lower = trimmed.toLowerCase();
  let inferredProvider = 'openai';
  let defaultModel = trimmed;

  if (lower.startsWith('claude') || lower === 'anthropic') {
    inferredProvider = 'anthropic';
    if (lower === 'anthropic') defaultModel = 'claude-3-5-sonnet-20241022';
  } else if (lower.startsWith('gemini') || lower === 'google') {
    inferredProvider = 'gemini';
    if (lower === 'gemini' || lower === 'google') defaultModel = 'gemini-1.5-pro';
  } else if (lower.startsWith('groq') || lower.startsWith('llama')) {
    inferredProvider = connections?.get('openrouter')?.status === 'connected' && !connections.get('groq')?.apiKey ? 'openrouter' : 'groq';
    if (lower === 'groq') defaultModel = 'llama-3.3-70b-versatile';
  } else if (lower.startsWith('deepseek')) {
    inferredProvider = 'deepseek';
    if (lower === 'deepseek') defaultModel = 'deepseek-chat';
  } else if (lower.startsWith('mistral')) {
    inferredProvider = 'mistral';
    if (lower === 'mistral') defaultModel = 'mistral-large-latest';
  } else if (lower.startsWith('nemotron') || lower.includes('nemotron')) {
    inferredProvider = 'openrouter';
  } else if (lower.startsWith('command') || lower.startsWith('cohere')) {
    inferredProvider = 'cohere';
  } else if (lower.startsWith('openai') || lower.startsWith('gpt') || lower.startsWith('o1') || lower.startsWith('o3')) {
    inferredProvider = 'openai';
    if (lower === 'openai') defaultModel = 'gpt-4o';
  } else {
    // If only one provider is connected in connections, use it
    const connectedProviders = connections
      ? Array.from(connections.values()).filter((c) => c.status === 'connected' && Boolean(c.apiKey))
      : [];
    if (connectedProviders.length === 1) {
      inferredProvider = connectedProviders[0].provider;
    } else if (connections?.get('openrouter')?.status === 'connected' && !connections.get('openai')?.apiKey) {
      inferredProvider = 'openrouter';
    } else {
      inferredProvider = lower;
    }
  }

  return {
    provider: inferredProvider,
    model: defaultModel,
  };
}

export class RoutingEngine {
  /**
   * Resolves provider and model targets given requested model and active rules
   */
  resolveRoute(
    requestedModel: string,
    rules: RoutingRuleConfig[],
    fallbacksHeader?: string | null,
    connections?: Map<string, ProviderConnectionConfig>,
    modelConfigs?: Array<{ modelId: string; provider: string; isEnabled?: boolean }>
  ): ResolvedRoute {
    const trimmed = (requestedModel || '').trim();
    const lower = trimmed.toLowerCase();

    // 1. Check for explicit provider prefix in the requested model (e.g. "openrouter/xyz" or "openrouter:xyz")
    let explicitProvider: string | null = null;
    let explicitModel: string | null = null;

    if (trimmed.includes(':') && !trimmed.startsWith('http')) {
      const colonIdx = trimmed.indexOf(':');
      const prefix = trimmed.substring(0, colonIdx).toLowerCase();
      const rest = trimmed.substring(colonIdx + 1);
      if (isKnownGatewayProvider(prefix, connections)) {
        explicitProvider = resolveCanonicalProvider(prefix);
        explicitModel = rest;
      }
    } else if (trimmed.includes('/')) {
      const slashIdx = trimmed.indexOf('/');
      const prefix = trimmed.substring(0, slashIdx).toLowerCase();
      const rest = trimmed.substring(slashIdx + 1);
      if (isKnownGatewayProvider(prefix, connections)) {
        explicitProvider = resolveCanonicalProvider(prefix);
        explicitModel = rest;
      }
    }

    // 2. Check modelConfigs configured for this project
    let configuredProvider: string | null = null;
    let configuredModel: string | null = null;
    if (modelConfigs && Array.isArray(modelConfigs)) {
      const found = modelConfigs.find(
        (m) =>
          m.modelId === trimmed ||
          m.modelId.toLowerCase() === lower ||
          (explicitModel && m.modelId === explicitModel)
      );
      if (found) {
        configuredProvider = found.provider;
        configuredModel = found.modelId;
      }
    }

    // 3. Separate rules into specific rules (modelPattern !== '*') and wildcard rules (modelPattern === '*')
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);
    const specificRules = sorted.filter((r) => r.modelPattern !== '*');
    const wildcardRules = sorted.filter((r) => r.modelPattern === '*');

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

    // Check specific rules first
    for (const rule of specificRules) {
      if (this.matchPattern(rule.modelPattern, trimmed)) {
        resolvedPrimaryProvider = rule.primaryProvider;
        resolvedPrimaryModel = rule.primaryModel === '*' ? trimmed : rule.primaryModel;
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

    // 4. If no specific rule matched:
    if (!matched) {
      if (explicitProvider) {
        resolvedPrimaryProvider = explicitProvider;
        resolvedPrimaryModel = explicitModel || trimmed;
      } else if (configuredProvider) {
        resolvedPrimaryProvider = configuredProvider;
        resolvedPrimaryModel = configuredModel || trimmed;
      } else {
        // Check wildcard rules ONLY IF the rule's primaryProvider is connected,
        // or if no connections map is supplied
        let wildcardMatched = false;
        if (wildcardRules.length > 0) {
          for (const rule of wildcardRules) {
            const conn = connections?.get(rule.primaryProvider);
            // Only apply wildcard rule if its primary provider is connected (has an API key) or no connections map
            if (!connections || (conn && conn.status === 'connected' && conn.apiKey)) {
              resolvedPrimaryProvider = rule.primaryProvider;
              resolvedPrimaryModel = rule.primaryModel === '*' ? trimmed : rule.primaryModel;
              resolvedSecondaryProvider = rule.secondaryProvider;
              resolvedSecondaryModel = rule.secondaryModel;
              timeoutMs = rule.timeoutMs || 30000;
              maxRetries = Math.max(1, rule.maxRetries || 1);
              fallbackOnTimeout = rule.fallbackOnTimeout;
              fallbackOnRateLimit = rule.fallbackOnRateLimit;
              fallbackOnError = rule.fallbackOnError;
              wildcardMatched = true;
              matched = true;
              break;
            }
          }
        }

        if (!wildcardMatched) {
          // Model name heuristics
          let inferredProvider = 'openai';
          let resolvedModel = trimmed;

          if (lower.includes('nemotron')) {
            inferredProvider = 'openrouter';
          } else if (lower.startsWith('claude') || lower === 'anthropic') {
            inferredProvider = 'anthropic';
            resolvedModel = lower === 'anthropic' ? 'claude-3-5-sonnet-20241022' : trimmed;
          } else if (lower.startsWith('gemini') || lower === 'google') {
            inferredProvider = 'gemini';
            resolvedModel = (lower === 'gemini' || lower === 'google') ? 'gemini-1.5-pro' : trimmed;
          } else if (lower.startsWith('deepseek')) {
            inferredProvider = 'deepseek';
            resolvedModel = lower === 'deepseek' ? 'deepseek-chat' : trimmed;
          } else if (lower.startsWith('groq') || lower.startsWith('llama')) {
            inferredProvider = connections?.get('openrouter')?.status === 'connected' && !connections.get('groq')?.apiKey ? 'openrouter' : 'groq';
            resolvedModel = lower === 'groq' ? 'llama-3.3-70b-versatile' : trimmed;
          } else if (lower.startsWith('mistral')) {
            inferredProvider = 'mistral';
            resolvedModel = lower === 'mistral' ? 'mistral-large-latest' : trimmed;
          } else if (lower.startsWith('cerebras')) {
            inferredProvider = 'cerebras';
          } else if (lower.startsWith('together')) {
            inferredProvider = 'together';
          } else if (lower.startsWith('fireworks')) {
            inferredProvider = 'fireworks';
          } else if (lower.startsWith('deepinfra')) {
            inferredProvider = 'deepinfra';
          } else if (lower.startsWith('hyperbolic')) {
            inferredProvider = 'hyperbolic';
          } else if (lower.startsWith('novita')) {
            inferredProvider = 'novita';
          } else if (lower.startsWith('xai') || lower.startsWith('grok')) {
            inferredProvider = 'xai';
          } else if (lower.startsWith('qwen') || lower.startsWith('dashscope')) {
            inferredProvider = 'dashscope';
          } else if (lower.startsWith('kimi') || lower.startsWith('moonshot')) {
            inferredProvider = 'moonshot';
          } else if (lower.startsWith('01ai') || lower.startsWith('yi-')) {
            inferredProvider = '01ai';
          } else if (lower.startsWith('zhipu') || lower.startsWith('glm-')) {
            inferredProvider = 'zhipu';
          } else if (lower.startsWith('minimax') || lower.startsWith('abab')) {
            inferredProvider = 'minimax';
          } else if (lower.startsWith('solar') || lower.startsWith('upstage')) {
            inferredProvider = 'upstage';
          } else if (lower.startsWith('vllm')) {
            inferredProvider = 'vllm';
          } else if (lower.startsWith('ollama')) {
            inferredProvider = 'ollama';
          } else if (lower.startsWith('openai') || lower.startsWith('gpt') || lower.startsWith('o1') || lower.startsWith('o3')) {
            inferredProvider = 'openai';
            resolvedModel = lower === 'openai' ? 'gpt-4o' : trimmed;
          } else if (trimmed.includes('/') && connections?.get('openrouter')?.status === 'connected') {
            // E.g. "nvidia/nemotron-4-340b" or "meta-llama/llama-3.3-70b-instruct"
            inferredProvider = 'openrouter';
            resolvedModel = trimmed;
          } else {
            // Check connected providers
            const connectedProviders = connections
              ? Array.from(connections.values()).filter((c) => c.status === 'connected' && Boolean(c.apiKey))
              : [];
            if (connectedProviders.length === 1) {
              inferredProvider = connectedProviders[0].provider;
            } else if (connections?.get('openrouter')?.status === 'connected' && !connections.get('openai')?.apiKey) {
              inferredProvider = 'openrouter';
            } else {
              inferredProvider = lower;
            }
          }

          resolvedPrimaryProvider = inferredProvider;
          resolvedPrimaryModel = resolvedModel;
        }
      }
    }

    // Support X-Tanvelo-Fallbacks ordered fallback chain
    let fallbackChain: FallbackTarget[] = [];
    if (fallbacksHeader) {
      const parsed = fallbacksHeader
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (parsed.length > 0) {
        fallbackChain = parsed.map((item) => parseFallbackTarget(item, connections, modelConfigs));
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
    fallbacksHeader?: string | null,
    modelConfigs?: Array<{ modelId: string; provider: string; isEnabled?: boolean }>
  ): Promise<ExecutionOutcome> {
    const route = this.resolveRoute(request.model, rules, fallbacksHeader, connections, modelConfigs);
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
    fallbacksHeader?: string | null,
    modelConfigs?: Array<{ modelId: string; provider: string; isEnabled?: boolean }>
  ): Promise<ExecutionOutcome> {
    const route = this.resolveRoute(request.model, rules, fallbacksHeader, connections, modelConfigs);
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
