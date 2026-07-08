import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const createRedisClient = (): Redis => {
  const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis: max retries reached, running without cache');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error('Redis error:', err));

  return redis;
};

// Lazy singleton — only created when first imported
let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};
