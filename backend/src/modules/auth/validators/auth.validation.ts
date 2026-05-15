import Joi from 'joi';
import type {
  AdminUpdateUserRequestBody,
  ChangePasswordRequestBody,
  DeleteAccountRequestBody,
  TokenIntrospectionRequestBody,
  UserLoginCredentials,
  UserSignUpCredentials
} from '../types/types';

export const signupSchema = {
  body: Joi.object<UserSignUpCredentials>().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6).max(150),
    username: Joi.string().required().min(2).max(50),
    role: Joi.string().valid('buyer', 'seller', 'both').default('buyer')
  })
};

export const loginSchema = {
  body: Joi.object<UserLoginCredentials>().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6).max(150)
  })
};

export const changePasswordSchema = {
  body: Joi.object<ChangePasswordRequestBody>().keys({
    currentPassword: Joi.string().required().min(6).max(150),
    newPassword: Joi.string().required().min(6).max(150)
  })
};

export const deleteAccountSchema = {
  body: Joi.object<DeleteAccountRequestBody>().keys({
    currentPassword: Joi.string().required().min(6).max(150)
  })
};

export const introspectTokenSchema = {
  body: Joi.object<TokenIntrospectionRequestBody>().keys({
    token: Joi.string().required()
  })
};

export const userIdParamSchema = {
  params: Joi.object().keys({
    id: Joi.string().required()
  })
};

export const adminUserListSchema = {
  query: Joi.object().keys({
    search: Joi.string().trim().allow(''),
    role: Joi.string().valid('buyer', 'seller', 'admin'),
    status: Joi.string().valid('active', 'blocked', 'suspended')
  })
};

export const enableMixedModeSchema = {
  body: Joi.object().max(0)
};

export const recommendationsOnboardingSchema = {
  body: Joi.object({
    action: Joi.string().valid('complete', 'skip').required(),
    categoryIds: Joi.array().items(Joi.string().trim().min(1).max(100)).max(50).when('action', {
      is: 'complete',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
  })
};

export const adminUpdateUserSchema = {
  body: Joi.object<AdminUpdateUserRequestBody>()
    .keys({
      name: Joi.string().trim().min(2).max(50),
      email: Joi.string().trim().email(),
      role: Joi.string().valid('buyer', 'seller', 'admin'),
      status: Joi.string().valid('active', 'blocked', 'suspended')
    })
    .min(1),
  params: Joi.object().keys({
    id: Joi.string().required()
  })
};
