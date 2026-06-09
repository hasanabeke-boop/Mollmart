import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../../request/utils/pagination';
import { MARKETPLACE_CURRENCY } from '../../../shared/marketplaceCurrency';
import { shippingSchema } from '../../../shared/shipping.validation';

export const conversationIdParamSchema = {
  params: Joi.object({
    conversationId: Joi.string().trim().min(1).required()
  })
};

export const proposalIdParamSchema = {
  params: Joi.object({
    proposalId: Joi.string().trim().min(1).required()
  })
};

export const createPriceProposalSchema = {
  body: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid(MARKETPLACE_CURRENCY).uppercase().default(MARKETPLACE_CURRENCY)
  })
};

export const requestOrderListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().trim().valid('paid', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled').optional()
  })
};

export const requestOrderIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().min(1).required()
  })
};

export const adminRequestOrderListSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().trim().valid('paid', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled').optional()
  })
};

export const adminRequestOrderPatchSchema = {
  params: Joi.object({
    id: Joi.string().trim().min(1).required()
  }),
  body: Joi.object({
    status: Joi.string().trim().valid('cancelled').optional(),
    trackingNumber: Joi.string().trim().max(120).allow('', null).optional(),
    carrier: Joi.string().trim().max(120).allow('', null).optional()
  }).min(1)
};

export const requestOrderStatusPatchSchema = {
  params: Joi.object({
    id: Joi.string().trim().min(1).required()
  }),
  body: Joi.object({
    status: Joi.string()
      .trim()
      .valid('in_progress', 'awaiting_confirmation', 'completed')
      .required(),
    trackingNumber: Joi.string().trim().max(120).allow('', null).optional(),
    carrier: Joi.string().trim().max(120).allow('', null).optional()
  })
};

export const placeOrderSchema = {
  body: shippingSchema
};
