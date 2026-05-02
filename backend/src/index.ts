import app from './app';
import config from './config/config';
import prisma from './config/prisma';
import { closeRedis, connectRedis } from './config/redis';
import logger from './middleware/logger';
import NotificationRepository from './modules/notification/repositories/notification.repository';
import NotificationEventMapper from './modules/notification/services/notification-event-mapper.service';
import NotificationWorker from './modules/notification/services/notification-worker.service';

const notificationWorker = new NotificationWorker(
  new NotificationRepository(),
  new NotificationEventMapper()
);

const server = app.listen(config.server.port, async () => {
  logger.info('mollmart-backend.started', {
    port: config.server.port,
    environment: config.nodeEnv
  });

  try {
    await connectRedis();
  } catch (error) {
    logger.warn(`Redis unavailable during startup: ${(error as Error).message}`);
  }

  try {
    await notificationWorker.start();
  } catch (error) {
    logger.warn(`Notification worker startup failed: ${(error as Error).message}`);
  }
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`mollmart-backend.shutdown.${signal}`);

  server.close(async () => {
    await prisma.$disconnect();
    await closeRedis();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
