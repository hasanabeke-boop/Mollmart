import { Router } from 'express';
import OfferController from '../../controllers/offer.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import {
  createOfferSchema,
  myOffersQuerySchema,
  offerIdParamSchema,
  requestOffersParamSchema,
  updateOfferSchema
} from '../../validators/offer.validation';

export function createOfferRouter(controller: OfferController): Router {
  const router = Router();

  router.use(authenticate);

  router.post('/', requireRoles('seller'), validate(createOfferSchema), asyncHandler(controller.create));
  router.patch('/:id', requireRoles('seller'), validate(updateOfferSchema), asyncHandler(controller.update));
  router.post(
    '/:id/withdraw',
    requireRoles('seller'),
    validate(offerIdParamSchema),
    asyncHandler(controller.withdraw)
  );
  router.get('/me', requireRoles('seller', 'admin'), validate(myOffersQuerySchema), asyncHandler(controller.getMine));
  router.get(
    '/request/:requestId',
    requireRoles('buyer', 'admin'),
    validate(requestOffersParamSchema),
    asyncHandler(controller.getByRequest)
  );
  router.post(
    '/:id/accept',
    requireRoles('buyer'),
    validate(offerIdParamSchema),
    asyncHandler(controller.accept)
  );

  return router;
}

export default createOfferRouter;
