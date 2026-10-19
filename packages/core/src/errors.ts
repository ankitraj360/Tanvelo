export enum ErrorCategory {
  INVALID_REQUEST = 'invalid_request',
  GATEWAY_KEY_REJECTED = 'gateway_key_rejected',
  GATEWAY_RATE_LIMIT_EXCEEDED = 'gateway_rate_limit_exceeded',
  PROVIDER_AUTH_FAILURE = 'provider_auth_failure',
  PROVIDER_RATE_LIMIT_EXCEEDED = 'provider_rate_limit_exceeded',
  PROVIDER_QUOTA_EXHAUSTED = 'provider_quota_exhausted',
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  UNSUPPORTED_MODEL = 'unsupported_model',
  INTERNAL_GATEWAY_ERROR = 'internal_gateway_error',
  BUDGET_EXCEEDED = 'budget_exceeded',
}

export interface OpenAICompatibleErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}

export class GatewayError extends Error {
  public category: ErrorCategory;
  public statusCode: number;
  public param?: string;
  public originalError?: any;
  public attempts?: any[];
  public rateLimitInfo?: { limit: number; remaining: number; resetSeconds: number };

  constructor(
    message: string,
    category: ErrorCategory,
    statusCode: number = 500,
    param?: string,
    originalError?: any,
    attempts?: any[],
    rateLimitInfo?: { limit: number; remaining: number; resetSeconds: number }
  ) {
    super(message);
    this.name = 'GatewayError';
    this.category = category;
    this.statusCode = statusCode;
    this.param = param;
    this.originalError = originalError;
    this.attempts = attempts;
    this.rateLimitInfo = rateLimitInfo;
  }

  toResponse(): OpenAICompatibleErrorResponse {
    return {
      error: {
        message: this.message,
        type: this.category,
        param: this.param || null,
        code: this.category,
      },
    };
  }
}

/**
 * Categorizes an upstream provider error status or message
 */
export function categorizeProviderError(status: number, message: string = ''): ErrorCategory {
  const lowerMsg = message.toLowerCase();

  if (status === 401 || status === 403 || lowerMsg.includes('api key') || lowerMsg.includes('unauthorized')) {
    return ErrorCategory.PROVIDER_AUTH_FAILURE;
  }
  if (status === 429) {
    if (lowerMsg.includes('quota') || lowerMsg.includes('credit') || lowerMsg.includes('billing')) {
      return ErrorCategory.PROVIDER_QUOTA_EXHAUSTED;
    }
    return ErrorCategory.PROVIDER_RATE_LIMIT_EXCEEDED;
  }
  if (status === 408 || status === 504 || lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
    return ErrorCategory.TIMEOUT;
  }
  if (status === 502 || status === 503 || lowerMsg.includes('unavailable') || lowerMsg.includes('overloaded')) {
    return ErrorCategory.PROVIDER_UNAVAILABLE;
  }
  if (status === 404 || lowerMsg.includes('model not found') || lowerMsg.includes('does not exist')) {
    return ErrorCategory.UNSUPPORTED_MODEL;
  }
  if (status >= 400 && status < 500) {
    return ErrorCategory.INVALID_REQUEST;
  }
  return ErrorCategory.INTERNAL_GATEWAY_ERROR;
}
