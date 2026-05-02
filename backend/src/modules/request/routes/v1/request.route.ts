import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import validate from '../../middleware/validate';
import { authenticate, requireRoles } from '../../middleware/auth';
import RequestController from '../../controllers/request.controller';
import {
  createRequestSchema,
  ownerListSchema,
  requestIdParamSchema,
  sellerBoardSchema,
  updateRequestSchema
} from '../../validators/request.validation';

export function createRequestRouter(controller: RequestController): Router {
  const router = Router();

  router.use(authenticate);

  router.post('/', requireRoles('buyer'), validate(createRequestSchema), asyncHandler(controller.create));
  router.post(
    '/:id/publish',
    requireRoles('buyer', 'admin'),
    validate(requestIdParamSchema),
    asyncHandler(controller.publish)
  );
  router.get('/me', requireRoles('buyer', 'admin'), validate(ownerListSchema), asyncHandler(controller.getMine));
  router.get('/', requireRoles('seller', 'admin'), validate(sellerBoardSchema), asyncHandler(controller.listBoard));
  router.get('/:id', validate(requestIdParamSchema), asyncHandler(controller.getById));
  router.patch(
    '/:id',
    requireRoles('buyer', 'admin'),
    validate(updateRequestSchema),
    asyncHandler(controller.update)
  );
  router.post(
    '/:id/close',
    requireRoles('buyer', 'admin'),
    validate(requestIdParamSchema),
    asyncHandler(controller.close)
  );
  router.post(
    '/:id/cancel',
    requireRoles('buyer', 'admin'),
    validate(requestIdParamSchema),
    asyncHandler(controller.cancel)
  );

  return router;
}

export default createRequestRouter;
