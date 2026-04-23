import { Notification, PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import prisma from '../config/prisma';
import { NotificationRecordInput } from '../types/notification';

export interface NotificationRepositoryLike {
  createIfNotExists(input: NotificationRecordInput): Promise<Notification | null>;
  listForUser(userId: string, isRead?: boolean): Promise<Notification[]>;
  markRead(userId: string, notificationId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
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
        error instanceof PrismaClientKnownRequestError &&
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
}

export default NotificationRepository;
