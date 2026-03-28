import { Notification } from '@prisma/client';
import { AuthUser } from '../types/express';
import { NotificationListQuery } from '../types/notification';
import { notFound } from '../utils/apiError';
import { NotificationRepositoryLike } from '../repositories/notification.repository';

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepositoryLike) {}

  async listNotifications(user: AuthUser, query: NotificationListQuery): Promise<Notification[]> {
    return this.notificationRepository.listForUser(user.id, query.isRead);
  }

  async markNotificationRead(user: AuthUser, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.markRead(user.id, notificationId);
    if (notification == null) {
      throw notFound('Notification not found');
    }

    return notification;
  }

  async markAllRead(user: AuthUser): Promise<{ updatedCount: number }> {
    const updatedCount = await this.notificationRepository.markAllRead(user.id);
    return { updatedCount };
  }
}

export default NotificationService;
