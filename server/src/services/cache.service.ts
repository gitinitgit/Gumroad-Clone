import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Redis-backed caching service for read-heavy public endpoints.
 *
 * Gracefully degrades: if Redis is unavailable, all operations
 * are no-ops and the caller falls through to the database.
 */
export class CacheService {
  private static readonly PREFIX = 'cache:';

  /**
   * Get a cached value. Returns null on miss or Redis failure.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      const data = await redis.get(`${this.PREFIX}${key}`);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.warn(`Cache get failed for key "${key}":`, err);
      return null;
    }
  }

  /**
   * Store a value with a TTL (in seconds).
   */
  static async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.setex(`${this.PREFIX}${key}`, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.warn(`Cache set failed for key "${key}":`, err);
    }
  }

  /**
   * Delete a specific cache key (used for invalidation on updates).
   */
  static async del(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(`${this.PREFIX}${key}`);
    } catch (err) {
      logger.warn(`Cache del failed for key "${key}":`, err);
    }
  }

  /**
   * Delete all keys matching a pattern (e.g., "product:*").
   * Uses SCAN to avoid blocking Redis.
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const fullPattern = `${this.PREFIX}${pattern}`;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.warn(`Cache delPattern failed for "${pattern}":`, err);
    }
  }
}

// ─── Cache TTL Constants (seconds) ───────────────────────────
export const CACHE_TTL = {
  FEATURED_PRODUCTS: 5 * 60,      // 5 minutes
  TRENDING_PRODUCTS: 5 * 60,      // 5 minutes
  CATEGORIES: 60 * 60,             // 1 hour
  PRODUCT_BY_SLUG: 2 * 60,        // 2 minutes
  DISCOVER_PRODUCTS: 60,           // 1 minute (varies by query)
} as const;
