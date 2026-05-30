import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../../request/utils/pagination';

const currency = Joi.string().valid('USD', 'EUR', 'RUB', 'KZT').uppercase();

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
  body: Joi.object({
    checkoutCurrency: currency.required(),
    shippingName: Joi.string().trim().max(200).allow('', null).optional(),
    shippingPhone: Joi.string().trim().max(40).allow('', null).optional(),
    shippingAddress: Joi.string().trim().max(2000).allow('', null).optional(),
    cardLast4: Joi.string().trim().length(4).pattern(/^\d{4}$/).optional(),
    cardHolderName: Joi.string().trim().min(2).max(120).optional()
  })
};

export const shopOrderListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().valid('processing', 'shipped', 'delivered', 'cancelled').optional()
  })
};

export const adminCatalogOrderListSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().valid('processing', 'shipped', 'delivered', 'cancelled').optional()
  })
};

export const adminCatalogOrderPatchSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('processing', 'shipped', 'delivered', 'cancelled').optional(),
    trackingNumber: Joi.string().trim().max(120).allow('', null).optional(),
    carrier: Joi.string().trim().max(120).allow('', null).optional()
  }).min(1)
};

export const shopOrderIdParamsSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};
