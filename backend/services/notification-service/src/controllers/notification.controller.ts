import { Request, Response } from 'express';
import httpStatus from 'http-status';
import NotificationService from '../services/notification.service';
import { NotificationListQuery } from '../types/notification';
import { badRequest } from '../utils/apiError';

function requireParam(value: string | undefined, name: string): string {
  if (value == null) {
    throw badRequest(`${name} is required`);
  }

  return value;
}

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const notifications = await this.notificationService.listNotifications(
      req.user!,
      req.query as unknown as NotificationListQuery
    );
    res.status(httpStatus.OK).json(notifications);
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const notificationId = requireParam(req.params.id, 'Notification id');
    const notification = await this.notificationService.markNotificationRead(req.user!, notificationId);
    res.status(httpStatus.OK).json(notification);
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    const result = await this.notificationService.markAllRead(req.user!);
    res.status(httpStatus.OK).json(result);
  };
}

export default NotificationController;
