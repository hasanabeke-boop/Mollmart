import Redis from 'ioredis';
import config from './config';
import logger from '../middleware/logger';

let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;

export function getRedisPublisher(): Redis | null {
  if (!config.redis.enabled) {
    return null;
  }

  if (redisPublisher == null) {
    redisPublisher = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    redisPublisher.on('error', (error) => {
      logger.warn(`Redis publisher error: ${error.message}`);
    });
  }

  return redisPublisher;
}

export function getRedisSubscriber(): Redis | null {
  if (!config.redis.enabled) {
    return null;
  }

  if (redisSubscriber == null) {
    redisSubscriber = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    redisSubscriber.on('error', (error) => {
      logger.warn(`Redis subscriber error: ${error.message}`);
    });
  }

  return redisSubscriber;
}
