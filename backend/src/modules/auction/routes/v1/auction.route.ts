import { Router } from 'express';
import { authenticateWorkspace, requireRoles } from '../../../../shared/authenticateWorkspace';
import asyncHandler from '../../../request/utils/asyncHandler';
import validate from '../../../request/middleware/validate';
import { auctionService } from '../../bootstrap';
import AuctionController from '../../controllers/auction.controller';
import { authenticateAuctionStream } from '../../middleware/stream-auth';
import {
  auctionWinnerPlaceOrderSchema,
  participateSchema,
  requestIdParamSchema,
  sessionIdParamSchema
} from '../../validators/auction.validation';

export function createAuctionRouter(controller: AuctionController): Router {
  const router = Router();

  router.get('/rules', asyncHandler(controller.getRules));

  router.get(
    '/:sessionId/stream',
    authenticateAuctionStream,
    validate(sessionIdParamSchema),
    asyncHandler(controller.stream)
  );

  router.use(authenticateWorkspace);

  router.get('/me', requireRoles('seller', 'admin'), asyncHandler(controller.listMine));
  router.get(
    '/request/:requestId',
    requireRoles('buyer', 'seller', 'admin'),
    validate(requestIdParamSchema),
    asyncHandler(controller.getByRequest)
  );
  router.get(
    '/:sessionId',
    requireRoles('buyer', 'seller', 'admin'),
    validate(sessionIdParamSchema),
    asyncHandler(controller.getById)
  );
  router.post(
    '/request/:requestId/participate',
    requireRoles('seller', 'admin'),
    validate(participateSchema),
    asyncHandler(controller.participate)
  );
  router.post(
    '/request/:requestId/winner-place-order',
    requireRoles('buyer', 'admin'),
    validate(auctionWinnerPlaceOrderSchema),
    asyncHandler(controller.placeWinnerOrder)
  );
  router.post(
    '/:sessionId/lower',
    requireRoles('seller', 'admin'),
    validate(sessionIdParamSchema),
    asyncHandler(controller.lower)
  );
  router.post(
    '/:sessionId/hold',
    requireRoles('seller', 'admin'),
    validate(sessionIdParamSchema),
    asyncHandler(controller.hold)
  );
  router.post(
    '/:sessionId/withdraw',
    requireRoles('seller', 'admin'),
    validate(sessionIdParamSchema),
    asyncHandler(controller.withdraw)
  );

  return router;
}
