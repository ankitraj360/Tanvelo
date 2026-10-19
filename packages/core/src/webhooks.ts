import dns from 'dns/promises';
import { computeWebhookSignature } from './crypto.js';

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookDispatchResult {
  isSuccess: boolean;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  attemptNumber: number;
}

/**
 * Validates that a webhook URL is not targeting loopback, private RFC1918, link-local, or cloud metadata IPs.
 */
export async function validateWebhookUrl(rawUrl: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, reason: 'Webhook URL must use HTTP or HTTPS protocol.' };
    }

    const hostname = parsed.hostname;

    // Check banned hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { valid: false, reason: 'Loopback and internal hostnames are prohibited.' };
    }

    // Resolve DNS to IP addresses
    let addresses: string[] = [];
    try {
      const records = await dns.lookup(hostname, { all: true });
      addresses = records.map((r) => r.address);
    } catch (err: any) {
      return { valid: false, reason: `DNS lookup failed for destination hostname: ${err.message}` };
    }

    for (const ip of addresses) {
      if (isPrivateOrRestrictedIp(ip)) {
        return { valid: false, reason: `Destination IP ${ip} is a private, loopback, or metadata address.` };
      }
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Malformed URL: ${err.message}` };
  }
}

/**
 * Checks if an IP is private, loopback, link-local, or cloud metadata
 */
function isPrivateOrRestrictedIp(ip: string): boolean {
  // IPv4 loopback (127.0.0.0/8)
  if (ip.startsWith('127.')) return true;
  // IPv4 Private networks
  if (ip.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('192.168.')) return true;
  // Link-local & cloud metadata (169.254.0.0/16)
  if (ip.startsWith('169.254.')) return true;
  // IPv4 broadcast / zero
  if (ip === '0.0.0.0' || ip === '255.255.255.255') return true;
  // IPv6 loopback
  if (ip === '::1' || ip === '::') return true;
  // IPv6 link-local (fe80::/10)
  if (ip.toLowerCase().startsWith('fe80:')) return true;
  // IPv6 unique local (fc00::/7)
  if (ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd')) return true;

  return false;
}

/**
 * Dispatches a webhook payload with signed HMAC headers and timeout
 */
export async function dispatchWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
  timeoutMs = 5000
): Promise<WebhookDispatchResult> {
  const validation = await validateWebhookUrl(url);
  if (!validation.valid) {
    return {
      isSuccess: false,
      attemptNumber: 1,
      errorMessage: `Blocked by SSRF protection: ${validation.reason}`,
    };
  }

  const payloadString = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const signature = computeWebhookSignature(`${timestamp}.${payloadString}`, secret);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tanvelo-Webhook-Dispatcher/1.0',
        'X-Tanvelo-Signature': `t=${timestamp},v1=${signature}`,
        'X-Tanvelo-Timestamp': timestamp,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const bodyText = await res.text();

    return {
      isSuccess: res.ok,
      statusCode: res.status,
      responseBody: bodyText.slice(0, 1000), // sanitize / truncate response
      attemptNumber: 1,
      errorMessage: res.ok ? undefined : `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      isSuccess: false,
      attemptNumber: 1,
      errorMessage: err.name === 'AbortError' ? 'Webhook delivery timed out' : err.message,
    };
  }
}

/**
 * Dispatches a webhook with retry scheduling and exponential backoff
 */
export async function dispatchWebhookWithRetries(
  url: string,
  secret: string,
  payload: WebhookPayload,
  maxRetries = 3,
  timeoutMs = 5000,
  backoffBaseMs = 200
): Promise<WebhookDispatchResult[]> {
  const attempts: WebhookDispatchResult[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1) {
      const delay = backoffBaseMs * Math.pow(2, attempt - 2);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const validation = await validateWebhookUrl(url);
    if (!validation.valid) {
      attempts.push({
        isSuccess: false,
        attemptNumber: attempt,
        errorMessage: `Blocked by SSRF protection: ${validation.reason}`,
      });
      break; // SSRF is permanent failure
    }

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = computeWebhookSignature(`${timestamp}.${payloadString}`, secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Tanvelo-Webhook-Dispatcher/1.0',
          'X-Tanvelo-Signature': `t=${timestamp},v1=${signature}`,
          'X-Tanvelo-Timestamp': timestamp,
          'X-Tanvelo-Delivery-Attempt': String(attempt),
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const bodyText = await res.text();

      const result: WebhookDispatchResult = {
        isSuccess: res.ok,
        statusCode: res.status,
        responseBody: bodyText.slice(0, 1000),
        attemptNumber: attempt,
        errorMessage: res.ok ? undefined : `HTTP ${res.status}: ${res.statusText}`,
      };
      attempts.push(result);

      if (res.ok) {
        break; // Delivery succeeded
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      attempts.push({
        isSuccess: false,
        attemptNumber: attempt,
        errorMessage: err.name === 'AbortError' ? 'Webhook delivery timed out' : err.message,
      });
    }
  }

  return attempts;
}
