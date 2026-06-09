import { Router } from 'express';
import DealController from '../../controllers/deal.controller';
import { authenticate, requireRoles } from '../../../request/middleware/auth';
import validate from '../../../request/middleware/validate';
import asyncHandler from '../../../request/utils/asyncHandler';
import {
  conversationIdParamSchema,
  createPriceProposalSchema,
  demoPaySchema,
  demoWithdrawSchema,
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
    '/conversations/:conversationId/demo-pay',
    validate({
      ...conversationIdParamSchema,
      ...demoPaySchema
    }),
    asyncHandler(controller.demoPay)
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

  router.get('/wallet/me', asyncHandler(controller.getWallet));
  router.post(
    '/wallet/demo-withdraw',
    requireRoles('seller'),
    validate(demoWithdrawSchema),
    asyncHandler(controller.demoWithdraw)
  );

  return router;
}

export default createDealRouter;
