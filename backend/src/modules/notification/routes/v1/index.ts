import { Router } from 'express';
import NotificationController from '../../controllers/notification.controller';
import NotificationRepository from '../../repositories/notification.repository';
import NotificationService from '../../services/notification.service';
import { createNotificationRouter } from './notification.route';

const router = Router();

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

router.use('/', createNotificationRouter(notificationController));

export default router;
