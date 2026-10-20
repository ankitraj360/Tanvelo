import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Returns a 32-byte Buffer from ENCRYPTION_SECRET or falls back to a deterministic 32-byte key in dev
 */
export function validateEncryptionConfig(
  secret = process.env.ENCRYPTION_SECRET,
  isProd = process.env.NODE_ENV === 'production'
): void {
  if (isProd) {
    if (!secret || secret.trim() === '') {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: ENCRYPTION_SECRET environment variable is missing in production.'
      );
    }
    if (secret.length !== 64 || !/^[0-9a-fA-F]+$/.test(secret)) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: ENCRYPTION_SECRET must be a 64-character hex string (32 bytes) in production.'
      );
    }
  }
}

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_SECRET is required in production.');
    }
    // Fallback key for development if not provided
    return crypto.scryptSync('tanvelo-default-development-secret-key', 'tanvelo-salt', 32);
  }
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_SECRET must be a 64-character hex string (32 bytes) in production.');
  }
  return crypto.scryptSync(secret, 'tanvelo-salt', 32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine iv:tag:encrypted in base64
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts an encrypted string created with encryptApiKey
 */
export function decryptApiKey(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err: any) {
    throw new Error(`Failed to decrypt API key: ${err.message}`);
  }
}

/**
 * Generates a new Tanvelo Gateway API Key
 * Returns the raw token (to show once to user), prefix, and SHA-256 hash (to store in DB)
 */
export function generateGatewayApiKey(environment: string = 'live'): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomBytes = crypto.randomBytes(24).toString('base64url');
  const envSlug =
    environment.toLowerCase().includes('live') || environment.toLowerCase().includes('prod')
      ? 'live'
      : 'test';
  const rawKey = `tv_${envSlug}_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 11) + '...';
  const keyHash = hashGatewayKey(rawKey);

  return { rawKey, keyPrefix, keyHash };
}

/**
 * Hashes a Gateway API key using SHA-256
 */
export function hashGatewayKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generates a secure random webhook secret
 */
export function generateWebhookSecret(): string {
  return 'whsec_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Computes an HMAC-SHA256 signature for webhook payload
 */
export function computeWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
