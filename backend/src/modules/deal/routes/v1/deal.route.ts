import { Router } from 'express';
import DealController from '../../controllers/deal.controller';
import { authenticate } from '../../../request/middleware/auth';
import validate from '../../../request/middleware/validate';
import asyncHandler from '../../../request/utils/asyncHandler';
import {
  conversationIdParamSchema,
  createPriceProposalSchema,
  placeOrderSchema,
  proposalIdParamSchema,
  requestOrderIdParamSchema,
  requestOrderListQuerySchema,
  requestOrderStatusPatchSchema
} from '../../validators/deal.validation';

export function createDealRouter(controller: DealController): Router {
  const router = Router();

  router.use(authenticate);

  router.get(
    '/conversations/:conversationId/deal-state',
    validate(conversationIdParamSchema),
    asyncHandler(controller.getDealState)
  );
  router.post(
    '/conversations/:conversationId/price-proposals',
    validate({
      ...conversationIdParamSchema,
      ...createPriceProposalSchema
    }),
    asyncHandler(controller.createProposal)
  );
  router.post(
    '/conversations/:conversationId/apply-offer-total',
    validate(conversationIdParamSchema),
    asyncHandler(controller.applyOfferTotal)
  );
  router.post(
    '/price-proposals/:proposalId/accept',
    validate(proposalIdParamSchema),
    asyncHandler(controller.acceptProposal)
  );
  router.post(
    '/conversations/:conversationId/place-order',
    validate({
      ...conversationIdParamSchema,
      ...placeOrderSchema
    }),
    asyncHandler(controller.placeOrder)
  );

  router.get(
    '/request-orders',
    validate(requestOrderListQuerySchema),
    asyncHandler(controller.listMyOrders)
  );
  router.get(
    '/request-orders/:id',
    validate(requestOrderIdParamSchema),
    asyncHandler(controller.getMyOrder)
  );
  router.patch(
    '/request-orders/:id/status',
    validate(requestOrderStatusPatchSchema),
    asyncHandler(controller.patchMyOrderStatus)
  );

  return router;
}

export default createDealRouter;
