import { Router } from 'express';
import ShopRepository from '../../../shop/repositories/shop.repository';
import ShopService from '../../../shop/services/shop.service';
import DealEventPublisher from '../../../deal/services/deal-event.service';
import DealService from '../../../deal/services/deal.service';
import OrderCancellationController from '../../controllers/order-cancellation.controller';
import OrderCancellationService from '../../services/order-cancellation.service';
import {
  createAdminOrderCancellationRouter,
  createOrderCancellationRouter
} from './order-cancellation.route';

const shopService = new ShopService(new ShopRepository());
const dealService = new DealService(new DealEventPublisher());
export const orderCancellationService = new OrderCancellationService(shopService, dealService);
const orderCancellationController = new OrderCancellationController(orderCancellationService);

const router = Router();
router.use('/cancellation-requests', createOrderCancellationRouter(orderCancellationController));
router.use(
  '/admin/cancellation-requests',
  createAdminOrderCancellationRouter(orderCancellationController)
);

export default router;
