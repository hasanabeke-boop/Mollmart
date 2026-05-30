import { Router } from 'express';
import Joi from 'joi';
import validate from '../../../request/middleware/validate';
import { authenticate, requireRoles } from '../../../request/middleware/auth';
import asyncHandler from '../../../request/utils/asyncHandler';
import PaymentController from '../../controllers/payment.controller';

const currency = Joi.string().trim().uppercase().length(3).required();

const cartCheckoutSessionSchema = {
  body: Joi.object({
    checkoutCurrency: currency,
    shippingName: Joi.string().trim().max(200).allow('', null).optional(),
    shippingPhone: Joi.string().trim().max(40).allow('', null).optional(),
    shippingAddress: Joi.string().trim().max(2000).allow('', null).optional()
  })
};

const requestDealCheckoutSessionSchema = {
  body: Joi.object({
    conversationId: Joi.string().trim().min(1).required()
  })
};

export function createPaymentRouter(controller: PaymentController): Router {
  const router = Router();

  router.get('/config', asyncHandler(controller.config));
  router.post(
    '/cart/checkout-session',
    authenticate,
    requireRoles('buyer', 'admin'),
    validate(cartCheckoutSessionSchema),
    asyncHandler(controller.createCartCheckoutSession)
  );
  router.post(
    '/request-deal/checkout-session',
    authenticate,
    requireRoles('buyer', 'admin'),
    validate(requestDealCheckoutSessionSchema),
    asyncHandler(controller.createRequestDealCheckoutSession)
  );

  return router;
}

export function createPaymentWebhookRouter(controller: PaymentController): Router {
  const router = Router();
  router.post('/', asyncHandler(controller.stripeWebhook));
  return router;
}
