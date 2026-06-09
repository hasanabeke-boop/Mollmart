import { Router } from 'express';
import { authenticate } from '../../../request/middleware/auth';
import validate from '../../../request/middleware/validate';
import asyncHandler from '../../../request/utils/asyncHandler';
import ShopController from '../../controllers/shop.controller';
import {
  shopCartAddSchema,
  shopCartDeleteParamsSchema,
  shopCartPatchSchema,
  shopCheckoutSchema,
  shopOrderIdParamsSchema,
  shopOrderListQuerySchema,
  shopOrderStatusPatchSchema
} from '../../validators/shop.validation';

export function createShopRouter(controller: ShopController): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/cart', asyncHandler(controller.getCart));
  router.post('/cart/items', validate(shopCartAddSchema), asyncHandler(controller.addCartItem));
  router.patch(
    '/cart/items/:productId',
    validate(shopCartPatchSchema),
    asyncHandler(controller.patchCartItem)
  );
  router.delete(
    '/cart/items/:productId',
    validate(shopCartDeleteParamsSchema),
    asyncHandler(controller.deleteCartItem)
  );
  router.post('/checkout', validate(shopCheckoutSchema), asyncHandler(controller.checkout));
  router.get('/orders', validate(shopOrderListQuerySchema), asyncHandler(controller.listOrders));
  router.get('/orders/:id', validate(shopOrderIdParamsSchema), asyncHandler(controller.getOrder));
  router.patch(
    '/orders/:id/status',
    validate(shopOrderStatusPatchSchema),
    asyncHandler(controller.patchOrderStatus)
  );

  return router;
}

export default createShopRouter;
