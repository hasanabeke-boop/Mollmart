import app from './app';
import config from './config/config';
import prisma from './config/prisma';
import { getRedisClient } from './config/redis';
import logger from './middleware/logger';

const server = app.listen(config.server.port, async () => {
  logger.info('chat-service.started', {
    port: config.server.port,
    environment: config.nodeEnv
  });

  const redis = getRedisClient();
  if (redis != null) {
    try {
      await redis.connect();
      logger.info('chat-service.redis.connected');
    } catch (error) {
      logger.warn(`Redis unavailable during startup: ${(error as Error).message}`);
    }
  }
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`chat-service.shutdown.${signal}`);

  server.close(async () => {
    await prisma.$disconnect();

    const redis = getRedisClient();
    if (redis != null && redis.status !== 'end') {
      await redis.quit();
    }

    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
