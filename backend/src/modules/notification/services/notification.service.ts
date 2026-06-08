import { Notification } from '@prisma/client';
import { NotificationPreferences } from '../../../shared/notificationPreferences';
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

  async countUnread(user: AuthUser): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(user.id);
    return { count };
  }

  async getPreferences(user: AuthUser): Promise<NotificationPreferences> {
    return this.notificationRepository.getPreferences(user.id);
  }

  async updatePreferences(
    user: AuthUser,
    input: NotificationPreferences
  ): Promise<NotificationPreferences> {
    return this.notificationRepository.updatePreferences(user.id, input);
  }
}

export default NotificationService;
