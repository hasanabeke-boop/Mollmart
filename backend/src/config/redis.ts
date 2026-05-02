import Redis from 'ioredis';
import config from './config';
import logger from '../middleware/logger';

let redisClient: Redis | null = null;
let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;

function createRedisClient(label: string): Redis | null {
  if (!config.redis.enabled) {
    return null;
  }

  const client = new Redis(config.redis.url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });

  client.on('error', (error) => {
    logger.warn(`Redis ${label} error: ${error.message}`);
  });

  return client;
}

export function getRedisClient(): Redis | null {
  redisClient ??= createRedisClient('client');
  return redisClient;
}

export function getRedisPublisher(): Redis | null {
  redisPublisher ??= getRedisClient();
  return redisPublisher;
}

export function getRedisSubscriber(): Redis | null {
  redisSubscriber ??= createRedisClient('subscriber');
  return redisSubscriber;
}

export async function connectRedis(): Promise<void> {
  const publisher = getRedisPublisher();

  if (publisher != null && publisher.status === 'wait') {
    await publisher.connect();
  }
}

export async function closeRedis(): Promise<void> {
  const clients = new Set([redisClient, redisPublisher, redisSubscriber].filter((client): client is Redis => client != null));

  await Promise.all(
    [...clients].map(async (client) => {
      if (client.status !== 'end') {
        await client.quit();
      }
    })
  );
}
