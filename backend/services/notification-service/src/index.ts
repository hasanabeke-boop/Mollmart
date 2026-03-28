import app from './app';
import config from './config/config';
import prisma from './config/prisma';
import { getRedisPublisher, getRedisSubscriber } from './config/redis';
import logger from './middleware/logger';
import NotificationRepository from './repositories/notification.repository';
import NotificationEventMapper from './services/notification-event-mapper.service';
import NotificationWorker from './services/notification-worker.service';

const notificationRepository = new NotificationRepository();
const notificationEventMapper = new NotificationEventMapper();
const notificationWorker = new NotificationWorker(notificationRepository, notificationEventMapper);

const server = app.listen(config.server.port, async () => {
  logger.info('notification-service.started', {
    port: config.server.port,
    environment: config.nodeEnv
  });

  const publisher = getRedisPublisher();
  if (publisher != null) {
    try {
      await publisher.connect();
    } catch (error) {
      logger.warn(`Redis publisher unavailable during startup: ${(error as Error).message}`);
    }
  }

  try {
    await notificationWorker.start();
  } catch (error) {
    logger.warn(`Notification worker startup failed: ${(error as Error).message}`);
  }
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`notification-service.shutdown.${signal}`);

  server.close(async () => {
    await prisma.$disconnect();

    const publisher = getRedisPublisher();
    if (publisher != null && publisher.status !== 'end') {
      await publisher.quit();
    }

    const subscriber = getRedisSubscriber();
    if (subscriber != null && subscriber.status !== 'end') {
      await subscriber.quit();
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
