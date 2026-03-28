import Joi from 'joi';

export const categoryCreateSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    slug: Joi.string().trim().min(2).max(120).required(),
    parentId: Joi.string().trim().optional(),
    isActive: Joi.boolean().default(true)
  })
};

export const categoryUpdateSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).optional(),
    slug: Joi.string().trim().min(2).max(120).optional(),
    parentId: Joi.string().trim().allow('').optional(),
    isActive: Joi.boolean().optional()
  }).min(1)
};

export const moderationCaseCreateSchema = {
  body: Joi.object({
    targetType: Joi.string().valid('request', 'offer', 'user').required(),
    targetId: Joi.string().trim().required(),
    reason: Joi.string().trim().min(5).max(3000).required(),
    assignedTo: Joi.string().trim().optional()
  })
};

export const moderationCaseListSchema = {
  query: Joi.object({
    status: Joi.string().valid('open', 'in_review', 'resolved', 'dismissed').optional(),
    targetType: Joi.string().valid('request', 'offer', 'user').optional()
  })
};

export const moderationCaseUpdateSchema = {
  params: Joi.object({
    id: Joi.string().trim().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('open', 'in_review', 'resolved', 'dismissed').optional(),
    assignedTo: Joi.string().trim().allow('').optional(),
    resolutionNote: Joi.string().trim().allow('').max(3000).optional(),
    actionType: Joi.string().valid('hide_content', 'unhide_content', 'note').optional()
  }).min(1)
};

export const userIdParamSchema = {
  params: Joi.object({
    userId: Joi.string().trim().required()
  })
};

export const blockUserSchema = {
  params: Joi.object({
    userId: Joi.string().trim().required()
  }),
  body: Joi.object({
    reason: Joi.string().trim().min(5).max(3000).required()
  })
};
