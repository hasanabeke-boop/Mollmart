import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../utils/pagination';

export const createConversationSchema = {
  body: Joi.object({
    requestId: Joi.string().trim().required(),
    offerId: Joi.string().trim().optional(),
    sellerId: Joi.string().trim().optional()
  })
};

export const conversationListSchema = {
  query: Joi.object({
    status: Joi.string().valid('active', 'closed').optional(),
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit)
  })
};

export const conversationIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};

export const messageListSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit)
  })
};

export const sendMessageSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    body: Joi.string().trim().min(1).max(5000).required(),
    messageType: Joi.string().valid('text', 'system').default('text')
  })
};
