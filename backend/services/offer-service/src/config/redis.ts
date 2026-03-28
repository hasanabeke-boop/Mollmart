import Redis from 'ioredis';
import config from './config';
import logger from '../middleware/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!config.redis.enabled) {
    return null;
  }

  if (redisClient == null) {
    redisClient = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    redisClient.on('error', (error) => {
      logger.warn(`Redis connection error: ${error.message}`);
    });
  }

  return redisClient;
}
