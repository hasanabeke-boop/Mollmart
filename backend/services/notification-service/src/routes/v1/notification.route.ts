import { Router } from 'express';
import NotificationController from '../../controllers/notification.controller';
import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import {
  notificationIdParamSchema,
  notificationListSchema
} from '../../validators/notification.validation';

export function createNotificationRouter(controller: NotificationController): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/notifications', validate(notificationListSchema), asyncHandler(controller.list));
  router.post('/notifications/:id/read', validate(notificationIdParamSchema), asyncHandler(controller.markRead));
  router.post('/notifications/read-all', asyncHandler(controller.markAllRead));

  return router;
}

export default createNotificationRouter;
