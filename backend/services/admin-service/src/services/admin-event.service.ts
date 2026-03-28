import { BlockedUser, Category, ModerationCase } from '@prisma/client';
import { getRedisClient } from '../config/redis';
import logger from '../middleware/logger';

export interface AdminEventPublisherLike {
  publishCategoryUpdated(category: Category): Promise<void>;
  publishModerationCaseCreated(moderationCase: ModerationCase): Promise<void>;
  publishModerationCaseResolved(moderationCase: ModerationCase): Promise<void>;
  publishUserBlocked(blockedUser: BlockedUser): Promise<void>;
  publishUserUnblocked(blockedUser: BlockedUser): Promise<void>;
}

export class AdminEventPublisher implements AdminEventPublisherLike {
  async publishCategoryUpdated(category: Category): Promise<void> {
    await this.publish('admin.category.updated', category);
  }

  async publishModerationCaseCreated(moderationCase: ModerationCase): Promise<void> {
    await this.publish('moderation.case.created', moderationCase);
  }

  async publishModerationCaseResolved(moderationCase: ModerationCase): Promise<void> {
    await this.publish('moderation.case.resolved', moderationCase);
  }

  async publishUserBlocked(blockedUser: BlockedUser): Promise<void> {
    await this.publish('user.blocked', blockedUser);
  }

  async publishUserUnblocked(blockedUser: BlockedUser): Promise<void> {
    await this.publish('user.unblocked', blockedUser);
  }

  private async publish(channel: string, payload: unknown): Promise<void> {
    const client = getRedisClient();
    if (client == null) {
      return;
    }

    try {
      if (client.status === 'wait') {
        await client.connect();
      }

      await client.publish(channel, JSON.stringify(payload));
    } catch (error) {
      logger.warn(`Failed to publish Redis event to ${channel}: ${(error as Error).message}`);
    }
  }
}

export default AdminEventPublisher;
