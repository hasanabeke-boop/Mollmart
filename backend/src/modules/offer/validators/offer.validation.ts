import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../utils/pagination';

const currency = Joi.string().trim().length(3).uppercase();

export const createOfferSchema = {
  body: Joi.object({
    requestId: Joi.string().trim().required(),
    price: Joi.number().precision(2).greater(0).required(),
    currency: currency.required(),
    message: Joi.string().trim().min(5).max(5000).required(),
    deliveryDays: Joi.number().integer().greater(0).optional(),
    warrantyInfo: Joi.string().trim().max(2000).optional()
  })
};

export const updateOfferSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    price: Joi.number().precision(2).greater(0).optional(),
    currency: currency.optional(),
    message: Joi.string().trim().min(5).max(5000).optional(),
    deliveryDays: Joi.number().integer().greater(0).optional(),
    warrantyInfo: Joi.string().trim().allow('').max(2000).optional()
  }).min(1)
};

export const offerIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};

export const requestOffersParamSchema = {
  params: Joi.object({
    requestId: Joi.string().trim().required()
  }),
  query: Joi.object({
    status: Joi.string().valid('submitted', 'updated', 'withdrawn', 'accepted', 'rejected', 'expired').optional(),
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'price').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export const myOffersQuerySchema = {
  query: Joi.object({
    requestId: Joi.string().trim().optional(),
    status: Joi.string().valid('submitted', 'updated', 'withdrawn', 'accepted', 'rejected', 'expired').optional(),
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'price').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};
