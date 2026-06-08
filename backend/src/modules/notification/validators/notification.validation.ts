import Joi from 'joi';

export const notificationListSchema = {
  query: Joi.object({
    isRead: Joi.boolean().optional()
  })
};

export const notificationIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  })
};

export const notificationPreferencesSchema = {
  body: Joi.object({
    requestUpdates: Joi.boolean().required(),
    offerReplies: Joi.boolean().required(),
    newsletter: Joi.boolean().required()
  })
};
