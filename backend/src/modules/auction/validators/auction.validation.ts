import Joi from 'joi';
import { demoCheckoutWithShippingSchema } from '../../../shared/demoPayment.validation';

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

export const auctionWinnerCheckoutSchema = {
  params: Joi.object({
    requestId: Joi.string().trim().required()
  }),
  body: demoCheckoutWithShippingSchema
};
