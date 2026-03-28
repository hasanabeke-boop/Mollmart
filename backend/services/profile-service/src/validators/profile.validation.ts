import Joi from 'joi';
import { normalizeLimit, normalizePage } from '../utils/pagination';

const urlOrEmpty = Joi.string().uri().allow('');

export const profileIdParamSchema = {
  params: Joi.object({
    userId: Joi.string().trim().required()
  })
};

export const updateBaseProfileSchema = {
  body: Joi.object({
    fullName: Joi.string().trim().min(2).max(150).optional(),
    phone: Joi.string().trim().max(50).allow('').optional(),
    city: Joi.string().trim().max(120).allow('').optional(),
    avatarUrl: urlOrEmpty.optional()
  }).min(1)
};

export const updateSellerProfileSchema = {
  body: Joi.object({
    displayName: Joi.string().trim().min(2).max(120).optional(),
    description: Joi.string().trim().max(3000).allow('').optional(),
    businessType: Joi.string().trim().max(80).allow('').optional(),
    website: urlOrEmpty.optional(),
    instagramUrl: urlOrEmpty.optional()
  }).min(1)
};

export const updateBuyerProfileSchema = {
  body: Joi.object({
    displayName: Joi.string().trim().min(2).max(120).optional(),
    city: Joi.string().trim().max(120).allow('').optional(),
    preferencesJson: Joi.object().unknown(true).optional()
  }).min(1)
};

export const sellerListQuerySchema = {
  query: Joi.object({
    city: Joi.string().trim().optional(),
    businessType: Joi.string().trim().optional(),
    verificationStatus: Joi.string().valid('unverified', 'pending', 'verified', 'rejected').optional(),
    page: Joi.number().integer().min(1).default(1).custom(normalizePage),
    limit: Joi.number().integer().min(1).max(100).default(20).custom(normalizeLimit)
  })
};
