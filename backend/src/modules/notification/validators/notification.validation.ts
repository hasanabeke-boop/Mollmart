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
