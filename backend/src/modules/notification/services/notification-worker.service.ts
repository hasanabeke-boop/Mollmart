import config from '../../../config/config';
import prisma from '../../../config/prisma';
import { getRedisSubscriber } from '../../../config/redis';
import logger from '../../../middleware/logger';
import { sendNotificationEmail } from '../../auth/utils/sendEmail.util';
import { NotificationRepositoryLike } from '../repositories/notification.repository';
import { EventEnvelope } from '../types/notification';
import { NotificationEventMapperLike } from './notification-event-mapper.service';

const baseChannels = [
  'request.published',
  'offer.created',
  'offer.accepted',
  'chat.message.created',
  'user.blocked',
  'shop.order.placed',
  'shop.order.status_changed'
] as const;

export class NotificationWorker {
  constructor(
    private readonly notificationRepository: NotificationRepositoryLike,
    private readonly notificationEventMapper: NotificationEventMapperLike
  ) {}

  async start(): Promise<void> {
    const subscriber = getRedisSubscriber();
    if (subscriber == null) {
      return;
    }

    if (subscriber.status === 'wait') {
      await subscriber.connect();
    }

    const channels = config.subscriptions.moderationEvents
      ? [...baseChannels, 'moderation.case.created']
      : [...baseChannels];

    await subscriber.subscribe(...channels);

    subscriber.on('message', (channel, rawPayload) => {
      void this.processRawEvent({
        channel,
        rawPayload
      });
    });

    logger.info(`notification-worker.subscribed ${channels.join(', ')}`);
  }

  private async processRawEvent(input: { channel: string; rawPayload: string }): Promise<void> {
    let payload: unknown;

    try {
      payload = JSON.parse(input.rawPayload);
    } catch {
      logger.warn(`Skipping non-JSON event on ${input.channel}`);
      return;
    }

    const mapped = this.notificationEventMapper.mapEvent({
      channel: input.channel,
      payload
    } satisfies EventEnvelope);

    for (const notification of mapped) {
      try {
        const created = await this.notificationRepository.createIfNotExists(notification);
        if (created != null) {
          try {
            const recipient = await prisma.user.findUnique({
              where: { id: notification.userId },
              select: { email: true }
            });
            if (recipient?.email != null && recipient.email.length > 0) {
              await sendNotificationEmail(recipient.email, notification.title, notification.body);
            }
          } catch (emailError) {
            logger.warn(
              `notification-worker.email_failed user=${notification.userId}: ${(emailError as Error).message}`
            );
          }
        }
      } catch (error) {
        logger.warn(
          `Failed to persist notification for ${notification.userId} on ${input.channel}: ${(error as Error).message}`
        );
      }
    }
  }
}

export default NotificationWorker;
