import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../utils/pagination';

const attachmentSchema = Joi.object({
  fileName: Joi.string().trim().min(1).max(255).required(),
  fileUrl: Joi.string().uri().required(),
  mimeType: Joi.string().trim().max(100).optional()
});

const isoDate = Joi.string().isoDate();
const currency = Joi.string().trim().length(3).uppercase();

export const createRequestSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(150).required(),
    description: Joi.string().trim().min(10).max(5000).required(),
    categoryId: Joi.string().trim().min(2).max(100).required(),
    budgetMin: Joi.number().precision(2).min(0).optional(),
    budgetMax: Joi.number().precision(2).min(0).optional(),
    currency: currency.required(),
    location: Joi.string().trim().max(150).optional(),
    deadlineAt: isoDate.optional(),
    isNegotiable: Joi.boolean().default(false),
    attachments: Joi.array().items(attachmentSchema).max(10).default([])
  })
};

export const updateRequestSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    title: Joi.string().trim().min(3).max(150).optional(),
    description: Joi.string().trim().min(10).max(5000).optional(),
    categoryId: Joi.string().trim().min(2).max(100).optional(),
    budgetMin: Joi.number().precision(2).min(0).optional(),
    budgetMax: Joi.number().precision(2).min(0).optional(),
    currency: currency.optional(),
    location: Joi.string().trim().allow('').max(150).optional(),
    deadlineAt: Joi.alternatives().try(isoDate, Joi.string().valid('')).optional(),
    isNegotiable: Joi.boolean().optional()
  }).min(1)
};

export const requestIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};

export const ownerListSchema = {
  query: Joi.object({
    status: Joi.string()
      .valid('draft', 'published', 'has_offers', 'in_negotiation', 'accepted', 'closed', 'cancelled')
      .optional(),
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'deadlineAt').default('updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export const sellerBoardSchema = {
  query: Joi.object({
    categoryId: Joi.string().trim().optional(),
    currency: currency.optional(),
    location: Joi.string().trim().optional(),
    q: Joi.string().trim().min(2).max(150).optional(),
    isNegotiable: Joi.boolean().optional(),
    budgetMin: Joi.number().precision(2).min(0).optional(),
    budgetMax: Joi.number().precision(2).min(0).optional(),
    deadlineFrom: isoDate.optional(),
    deadlineTo: isoDate.optional(),
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    sortBy: Joi.string()
      .valid('publishedAt', 'createdAt', 'deadlineAt', 'budgetMin', 'budgetMax')
      .default('publishedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};
