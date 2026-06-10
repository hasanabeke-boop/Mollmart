import Joi from 'joi';
import { OrderCancellationStatus } from '@prisma/client';
import { normalizeLimit, normalizePage } from '../../request/utils/pagination';

export const createCancellationRequestSchema = {
  body: Joi.object({
    orderId: Joi.string().trim().required(),
    reason: Joi.string().trim().min(5).max(2000).required()
  })
};

export const orderIdParamSchema = {
  params: Joi.object({
    orderId: Joi.string().trim().required()
  })
};

export const cancellationIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};

export const listMineCancellationSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit)
  })
};

export const listAdminCancellationSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    status: Joi.string()
      .valid(...Object.values(OrderCancellationStatus))
      .optional()
  })
};

export const reviewCancellationSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    adminNote: Joi.string().trim().max(2000).allow('').optional()
  })
};
