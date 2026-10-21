import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.0001) return `<$0.0001`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null || isNaN(Number(ms))) return '0ms';
  const n = Number(ms);
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(2)}s`;
}

/**
 * Safely extracts a clean human-readable error string from any error type,
 * object, or API response body so it never crashes React with "Objects are not valid as a React child".
 */
export function extractErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const anyErr = err as any;
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (typeof anyErr.error === 'string') return anyErr.error;
    if (anyErr.error && typeof anyErr.error.message === 'string') return anyErr.error.message;
    if (typeof anyErr.statusText === 'string') return anyErr.statusText;
    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}') return json;
    } catch {
      // ignore
    }
  }
  return String(err) || fallback;
}

/**
 * Safely parse JSON from fetch Response, handling HTML/text error fallbacks
 * and always returning clean error messages.
 */
export async function parseApiResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(text || `Request failed with status ${res.status}`);
    }
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok) {
    const msg = extractErrorMessage(data?.error || data?.message || data, `Request failed with status ${res.status}`);
    throw new Error(msg);
  }
  return data;
}
