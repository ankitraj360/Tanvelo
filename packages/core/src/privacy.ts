/**
 * Privacy sanitization for request & response logging
 */

const REDACTED_KEYS = new Set([
  'authorization',
  'api-key',
  'x-api-key',
  'apikey',
  'secret',
  'password',
  'token',
  'bearer',
]);

export function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizePayload(payload: any, maxDepth = 4): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  if (maxDepth <= 0) return '[TRUNCATED]';

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item, maxDepth - 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'string' && val.length > 5000) {
      sanitized[key] = val.substring(0, 5000) + '... [TRUNCATED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizePayload(val, maxDepth - 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}
