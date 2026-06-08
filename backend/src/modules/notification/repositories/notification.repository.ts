import { Notification, Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../config/prisma';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
  parseNotificationPreferences
} from '../../../shared/notificationPreferences';
import { NotificationRecordInput } from '../types/notification';

export interface NotificationRepositoryLike {
  createIfNotExists(input: NotificationRecordInput): Promise<Notification | null>;
  listForUser(userId: string, isRead?: boolean): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(userId: string, notificationId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
  getPreferences(userId: string): Promise<NotificationPreferences>;
  updatePreferences(
    userId: string,
    input: NotificationPreferences
  ): Promise<NotificationPreferences>;
}

export class NotificationRepository implements NotificationRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async createIfNotExists(input: NotificationRecordInput): Promise<Notification | null> {
    try {
      return await this.client.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          ...(input.dedupeKey !== undefined ? { dedupeKey: input.dedupeKey } : {})
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        input.dedupeKey !== undefined
      ) {
        return null;
      }

      throw error;
    }
  }

  async listForUser(userId: string, isRead?: boolean): Promise<Notification[]> {
    return this.client.notification.findMany({
      where: {
        userId,
        ...(isRead !== undefined ? { isRead } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.client.notification.count({
      where: { userId, isRead: false }
    });
  }

  async markRead(userId: string, notificationId: string): Promise<Notification | null> {
    const notification = await this.client.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (notification == null) {
      return null;
    }

    if (notification.isRead) {
      return notification;
    }

    return this.client.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.client.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return result.count;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.client.user.findUnique({
      where: { id: userId },
      select: { notificationPreferencesJson: true }
    });

    if (user == null) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    return parseNotificationPreferences(user.notificationPreferencesJson);
  }

  async updatePreferences(
    userId: string,
    input: NotificationPreferences
  ): Promise<NotificationPreferences> {
    const user = await this.client.user.update({
      where: { id: userId },
      data: {
        notificationPreferencesJson: input as Prisma.InputJsonValue
      },
      select: { notificationPreferencesJson: true }
    });

    return parseNotificationPreferences(user.notificationPreferencesJson);
  }
}

export default NotificationRepository;
