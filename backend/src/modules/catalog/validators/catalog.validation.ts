import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../../request/utils/pagination';

const catalogCurrency = Joi.string().valid('USD', 'EUR', 'RUB', 'KZT').uppercase();

const imageUrlValue = Joi.alternatives().try(
  Joi.string().trim().uri({ scheme: ['http', 'https'] }).min(8).max(2000),
  Joi.string()
    .trim()
    .pattern(/^\/uploads\/catalog\/[\w-]+\.(jpe?g|png|webp|gif)$/i)
    .max(500)
);

export const catalogListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit),
    q: Joi.string().trim().max(200).allow('').optional(),
    categoryId: Joi.string().trim().optional(),
    currency: catalogCurrency.optional().default('USD'),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    sort: Joi.string().valid('newest', 'price_asc', 'price_desc').default('newest')
  })
};

export const catalogMineQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit)
  })
};

export const catalogSlugParamsSchema = {
  params: Joi.object({
    slug: Joi.string().trim().min(1).max(160).required()
  }),
  query: Joi.object({
    currency: catalogCurrency.optional().default('USD')
  })
};

export const catalogCreateSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().min(10).max(20000).required(),
    categoryId: Joi.string().trim().required(),
    price: Joi.number().precision(2).greater(0).required(),
    compareAtPrice: Joi.number().precision(2).greater(0).optional().allow(null),
    currency: catalogCurrency.default('USD'),
    imageUrl: imageUrlValue.required(),
    galleryUrls: Joi.array().items(imageUrlValue).max(12).optional().default([]),
    quantity: Joi.number().integer().min(0).max(1_000_000).default(0),
    status: Joi.string().valid('draft', 'published', 'archived').default('published')
  })
};

export const catalogIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};

export const catalogUpdateSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    title: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().trim().min(10).max(20000).optional(),
    categoryId: Joi.string().trim().optional(),
    price: Joi.number().precision(2).greater(0).optional(),
    compareAtPrice: Joi.number().precision(2).greater(0).optional().allow(null),
    currency: catalogCurrency.optional(),
    imageUrl: imageUrlValue.optional(),
    galleryUrls: Joi.array().items(imageUrlValue).max(12).optional().allow(null),
    quantity: Joi.number().integer().min(0).max(1_000_000).optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional()
  }).min(1)
};
