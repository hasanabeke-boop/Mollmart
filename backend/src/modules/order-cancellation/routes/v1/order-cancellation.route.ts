import { Router } from 'express';
import { authenticate } from '../../../request/middleware/auth';
import { requireAdmin } from '../../../admin/middleware/auth';
import validate from '../../../request/middleware/validate';
import asyncHandler from '../../../request/utils/asyncHandler';
import OrderCancellationController from '../../controllers/order-cancellation.controller';
import {
  createCancellationRequestSchema,
  listAdminCancellationSchema,
  listMineCancellationSchema,
  orderIdParamSchema,
  reviewCancellationSchema
} from '../../validators/order-cancellation.validation';

export function createOrderCancellationRouter(controller: OrderCancellationController): Router {
  const router = Router();

  router.use(authenticate);

  router.post('/', validate(createCancellationRequestSchema), asyncHandler(controller.create));
  router.get('/mine', validate(listMineCancellationSchema), asyncHandler(controller.listMine));
  router.get(
    '/order/:orderId',
    validate(orderIdParamSchema),
    asyncHandler(controller.getForOrder)
  );

  return router;
}

export function createAdminOrderCancellationRouter(controller: OrderCancellationController): Router {
  const router = Router();

  router.use(authenticate);
  router.use(requireAdmin);

  router.get('/', validate(listAdminCancellationSchema), asyncHandler(controller.listAdmin));
  router.post(
    '/:id/approve',
    validate(reviewCancellationSchema),
    asyncHandler(controller.approve)
  );
  router.post(
    '/:id/reject',
    validate(reviewCancellationSchema),
    asyncHandler(controller.reject)
  );

  return router;
}
