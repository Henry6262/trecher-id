import { redis } from './redis';
import { logger } from './logger';

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}

/**
 * Basic rate limiter using Redis.
 * Fails OPEN if Redis is down to ensure availability.
 * 
 * @param key Redis key for the rate limit
 * @param limit Maximum number of requests
 * @param windowSeconds Time window in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 3600
): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;
  
  try {
    const count = await redis.incr(fullKey);
    if (count === 1) {
      await redis.expire(fullKey, windowSeconds);
    }
    
    return {
      allowed: count <= limit,
      current: count,
      limit,
      remaining: Math.max(0, limit - count),
    };
  } catch (err) {
    logger.error('rate-limit', 'Redis failure during rate limit check', err, { key: fullKey });
    // Fail OPEN: allow request if Redis is down
    return {
      allowed: true,
      current: 0,
      limit,
      remaining: limit,
    };
  }
}

/**
 * Helper to get client IP from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}
