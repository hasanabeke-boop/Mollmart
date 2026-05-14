import Joi from 'joi';

export const chatbotMessageSchema = {
  body: Joi.object({
    message: Joi.string().trim().min(1).max(2000).required(),
    history: Joi.array()
      .items(
        Joi.object({
          role: Joi.string().valid('user', 'assistant').required(),
          content: Joi.string().trim().min(1).max(4000).required()
        })
      )
      .max(20)
      .optional(),
    currentPath: Joi.string().trim().max(200).optional(),
    userRole: Joi.string().valid('buyer', 'seller', 'admin').optional()
  })
};
