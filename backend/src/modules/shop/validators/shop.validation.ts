import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../../request/utils/pagination';
import { MARKETPLACE_CURRENCY } from '../../../shared/marketplaceCurrency';
import { demoCheckoutWithShippingSchema } from '../../../shared/demoPayment.validation';

const currency = Joi.string().valid(MARKETPLACE_CURRENCY).uppercase().default(MARKETPLACE_CURRENCY);

export const shopCartAddSchema = {
  body: Joi.object({
    productId: Joi.string().trim().required(),
    quantity: Joi.number().integer().min(1).max(999).optional()
  })
};

export const shopCartPatchSchema = {
  params: Joi.object({
    productId: Joi.string().trim().required()
  }),
  body: Joi.object({
    quantity: Joi.number().integer().min(0).max(999_999).required()
  })
};

export const shopCartDeleteParamsSchema = {
  params: Joi.object({
    productId: Joi.string().trim().required()
  })
};

export const shopCheckoutSchema = {
  body: demoCheckoutWithShippingSchema.keys({
    checkoutCurrency: currency
  })
};

export const shopOrderListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().valid('paid', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled').optional()
  })
};

export const adminCatalogOrderListSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().valid('paid', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled').optional()
  })
};

export const adminCatalogOrderPatchSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('cancelled').optional(),
    trackingNumber: Joi.string().trim().max(120).allow('', null).optional(),
    carrier: Joi.string().trim().max(120).allow('', null).optional()
  }).min(1)
};

export const shopOrderStatusPatchSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    status: Joi.string()
      .valid('in_progress', 'awaiting_confirmation', 'completed')
      .required(),
    trackingNumber: Joi.string().trim().max(120).allow('', null).optional(),
    carrier: Joi.string().trim().max(120).allow('', null).optional()
  })
};

export const shopOrderIdParamsSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};
