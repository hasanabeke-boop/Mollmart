import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../../request/utils/pagination';

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
    currency: Joi.string().trim().uppercase().length(3).required()
  })
};

export const requestOrderListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string().trim().valid('processing', 'shipped', 'delivered', 'cancelled').optional()
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
    status: Joi.string().trim().valid('processing', 'shipped', 'delivered', 'cancelled').optional()
  })
};

export const adminRequestOrderPatchSchema = {
  params: Joi.object({
    id: Joi.string().trim().min(1).required()
  }),
  body: Joi.object({
    status: Joi.string().trim().valid('processing', 'shipped', 'delivered', 'cancelled').optional(),
    trackingNumber: Joi.string().trim().max(120).allow('', null).optional(),
    carrier: Joi.string().trim().max(120).allow('', null).optional()
  }).min(1)
};

export const demoPaySchema = {
  body: Joi.object({
    cardLast4: Joi.string().trim().length(4).pattern(/^\d{4}$/).required()
  })
};

export const demoWithdrawSchema = {
  body: Joi.object({
    amount: Joi.number().positive().max(1_000_000).required()
  })
};
