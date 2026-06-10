import Joi from 'joi';
import { shippingSchema } from '../../../shared/shipping.validation';

export const participateSchema = {
  params: Joi.object({
    requestId: Joi.string().trim().required()
  }),
  body: Joi.object({
    startPrice: Joi.number().positive().required(),
    floorPrice: Joi.number().positive().required(),
    deliveryDays: Joi.number().integer().min(1).optional(),
    message: Joi.string().trim().max(2000).optional()
  })
};

export const lowerPriceSchema = {
  params: Joi.object({
    sessionId: Joi.string().trim().required()
  }),
  body: Joi.object({
    targetPrice: Joi.number().positive().optional()
  })
};

export const sessionIdParamSchema = {
  params: Joi.object({
    sessionId: Joi.string().trim().required()
  })
};

export const requestIdParamSchema = {
  params: Joi.object({
    requestId: Joi.string().trim().required()
  })
};

export const auctionWinnerPlaceOrderSchema = {
  params: Joi.object({
    requestId: Joi.string().trim().required()
  }),
  body: shippingSchema
};
