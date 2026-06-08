import Joi from 'joi';
import type {
  ChangePasswordRequestBodyType,
  EmailRequestBody
} from '../types/types';

export const forgotPasswordSchema = {
  body: Joi.object<EmailRequestBody>().keys({
    email: Joi.string().required().email()
  })
};

export const resetPasswordSchema = {
  body: Joi.object().keys({
    newPassword: Joi.string().required().min(6).max(150)
  }),
  params: Joi.object().keys({
    token: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required()
  })
};

export const changePasswordSchema = {
  body: Joi.object<ChangePasswordRequestBodyType>().keys({
    currentPassword: Joi.string().required().min(6).max(150),
    newPassword: Joi.string().required().min(6).max(150)
  })
};

export const confirmPasswordChangeSchema = {
  params: Joi.object().keys({
    token: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required()
  })
};

export const resetPasswordTokenSchema = {
  params: Joi.object().keys({
    token: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required()
  })
};
