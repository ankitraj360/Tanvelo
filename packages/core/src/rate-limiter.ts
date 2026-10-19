import Redis from 'ioredis';

export interface RateLimitPolicyConfig {
  requestsPerMinute?: number | null;
  requestsPerHour?: number | null;
  requestsPerDay?: number | null;
  tokensPerMinute?: number | null;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  limitType: 'minute' | 'hour' | 'day' | 'tokens' | 'none';
  errorMessage?: string;
}

export class RateLimiter {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { count: number; expiresAt: number }> = new Map();
  private redisAvailable = false;
  private hasLoggedRedisWarning = false;

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL;
    if (url) {
      try {
        this.redis = new Redis(url, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: (times) => {
            if (times > 3) {
              if (!this.hasLoggedRedisWarning) {
                console.warn(
                  `[RateLimiter] WARNING: Redis at ${url} is unreachable. Falling back to in-memory rate limiting. Distributed rate limiting is inactive.`
                );
                this.hasLoggedRedisWarning = true;
              }
              this.redisAvailable = false;
              return null;
            }
            return Math.min(times * 200, 1000);
          },
        });

        this.redis.on('connect', () => {
          this.redisAvailable = true;
          this.hasLoggedRedisWarning = false;
        });

        this.redis.on('error', (err) => {
          if (!this.hasLoggedRedisWarning) {
            console.warn(
              `[RateLimiter] WARNING: Redis connection error: ${err.message}. Falling back to in-memory rate limiting.`
            );
            this.hasLoggedRedisWarning = true;
          }
          this.redisAvailable = false;
        });
      } catch (err: any) {
        console.warn(`[RateLimiter] WARNING: Failed to initialize Redis: ${err.message}`);
        this.redisAvailable = false;
      }
    }
  }

  /**
   * Evaluates rate limits for a given entity key (e.g. project:id or key:id)
   */
  async checkRateLimit(
    identifier: string,
    policy: RateLimitPolicyConfig
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);

    let lowestRemaining = Infinity;
    let effectiveLimit = 1000;
    let effectiveReset = 60;
    let activeLimitType: RateLimitResult['limitType'] = 'none';

    // 0. Tokens per minute limit (checked against tokens consumed so far in current window)
    if (policy.tokensPerMinute && policy.tokensPerMinute > 0) {
      const windowSec = 60;
      const key = `ratelimit:tok:${identifier}:${Math.floor(now / windowSec)}`;
      const currentTokens = await this.get(key);
      const remainingTokens = Math.max(0, policy.tokensPerMinute - currentTokens);
      const reset = windowSec - (now % windowSec);

      if (currentTokens >= policy.tokensPerMinute) {
        return {
          allowed: false,
          limit: policy.tokensPerMinute,
          remaining: 0,
          resetSeconds: reset,
          limitType: 'tokens',
          errorMessage: `Gateway rate limit exceeded: maximum ${policy.tokensPerMinute} tokens per minute allowed. Try again in ${reset}s.`,
        };
      }
    }

    // 1. Minute limit
    if (policy.requestsPerMinute && policy.requestsPerMinute > 0) {
      const windowSec = 60;
      const key = `ratelimit:min:${identifier}:${Math.floor(now / windowSec)}`;
      const current = await this.increment(key, windowSec);
      const remaining = Math.max(0, policy.requestsPerMinute - current);
      const reset = windowSec - (now % windowSec);

      if (current > policy.requestsPerMinute) {
        return {
          allowed: false,
          limit: policy.requestsPerMinute,
          remaining: 0,
          resetSeconds: reset,
          limitType: 'minute',
          errorMessage: `Gateway rate limit exceeded: maximum ${policy.requestsPerMinute} requests per minute allowed. Try again in ${reset}s.`,
        };
      }

      if (remaining < lowestRemaining) {
        lowestRemaining = remaining;
        effectiveLimit = policy.requestsPerMinute;
        effectiveReset = reset;
        activeLimitType = 'minute';
      }
    }

    // 2. Hour limit
    if (policy.requestsPerHour && policy.requestsPerHour > 0) {
      const windowSec = 3600;
      const key = `ratelimit:hr:${identifier}:${Math.floor(now / windowSec)}`;
      const current = await this.increment(key, windowSec);
      const remaining = Math.max(0, policy.requestsPerHour - current);
      const reset = windowSec - (now % windowSec);

      if (current > policy.requestsPerHour) {
        return {
          allowed: false,
          limit: policy.requestsPerHour,
          remaining: 0,
          resetSeconds: reset,
          limitType: 'hour',
          errorMessage: `Gateway rate limit exceeded: maximum ${policy.requestsPerHour} requests per hour allowed. Try again in ${reset}s.`,
        };
      }

      if (remaining < lowestRemaining) {
        lowestRemaining = remaining;
        effectiveLimit = policy.requestsPerHour;
        effectiveReset = reset;
        activeLimitType = 'hour';
      }
    }

    // 3. Day limit
    if (policy.requestsPerDay && policy.requestsPerDay > 0) {
      const windowSec = 86400;
      const key = `ratelimit:day:${identifier}:${Math.floor(now / windowSec)}`;
      const current = await this.increment(key, windowSec);
      const remaining = Math.max(0, policy.requestsPerDay - current);
      const reset = windowSec - (now % windowSec);

      if (current > policy.requestsPerDay) {
        return {
          allowed: false,
          limit: policy.requestsPerDay,
          remaining: 0,
          resetSeconds: reset,
          limitType: 'day',
          errorMessage: `Gateway rate limit exceeded: maximum ${policy.requestsPerDay} requests per day allowed. Try again in ${reset}s.`,
        };
      }

      if (remaining < lowestRemaining) {
        lowestRemaining = remaining;
        effectiveLimit = policy.requestsPerDay;
        effectiveReset = reset;
        activeLimitType = 'day';
      }
    }

    // Passed all active limits
    const finalLimit = lowestRemaining === Infinity ? 1000 : effectiveLimit;
    const finalRemaining = lowestRemaining === Infinity ? 999 : lowestRemaining;

    return {
      allowed: true,
      limit: finalLimit,
      remaining: finalRemaining,
      resetSeconds: effectiveReset,
      limitType: activeLimitType,
    };
  }

  /**
   * Records token usage for tokensPerMinute enforcement
   */
  async recordTokenUsage(identifier: string, tokens: number): Promise<void> {
    if (!tokens || tokens <= 0) return;
    const now = Math.floor(Date.now() / 1000);
    const windowSec = 60;
    const key = `ratelimit:tok:${identifier}:${Math.floor(now / windowSec)}`;
    await this.incrementBy(key, tokens, windowSec);
  }

  private async increment(key: string, ttlSeconds: number): Promise<number> {
    return this.incrementBy(key, 1, ttlSeconds);
  }

  private async incrementBy(key: string, amount: number, ttlSeconds: number): Promise<number> {
    if (this.redis && this.redisAvailable) {
      try {
        const multi = this.redis.multi();
        multi.incrby(key, amount);
        multi.expire(key, ttlSeconds);
        const results = await multi.exec();
        if (results && results[0] && results[0][1] !== undefined) {
          return Number(results[0][1]);
        }
      } catch (e) {
        this.redisAvailable = false;
      }
    }

    // Memory fallback with atomic eviction
    const now = Date.now();
    const entry = this.memoryStore.get(key);
    if (!entry || entry.expiresAt < now) {
      this.memoryStore.set(key, { count: amount, expiresAt: now + ttlSeconds * 1000 });
      return amount;
    } else {
      entry.count += amount;
      return entry.count;
    }
  }

  private async get(key: string): Promise<number> {
    if (this.redis && this.redisAvailable) {
      try {
        const val = await this.redis.get(key);
        return val ? parseInt(val, 10) || 0 : 0;
      } catch (e) {
        this.redisAvailable = false;
      }
    }

    const now = Date.now();
    const entry = this.memoryStore.get(key);
    if (!entry || entry.expiresAt < now) {
      return 0;
    }
    return entry.count;
  }

  isRedisConnected(): boolean {
    return this.redisAvailable;
  }

  getStatus(): { distributed: boolean; backend: 'redis' | 'memory' } {
    return {
      distributed: this.redisAvailable,
      backend: this.redisAvailable ? 'redis' : 'memory',
    };
  }

  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (_) {
        this.redis.disconnect();
      }
      this.redisAvailable = false;
    }
  }
}
