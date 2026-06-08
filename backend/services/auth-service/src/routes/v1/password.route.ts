import { Router } from 'express';
import validate from '../../middleware/validate';
import isAuth from '../../middleware/isAuth';
import {
  changePasswordSchema,
  confirmPasswordChangeSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../../validations/password.validation';
import * as passwordController from '../../controller/forgotPassword.controller';

const passwordRouter = Router();

passwordRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  passwordController.handleForgotPassword
);
passwordRouter.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  passwordController.handleResetPassword
);
passwordRouter.post(
  '/change-password',
  isAuth,
  validate(changePasswordSchema),
  passwordController.handleChangePasswordRequest
);
passwordRouter.get(
  '/confirm-password-change/:token',
  validate(confirmPasswordChangeSchema),
  passwordController.handleConfirmPasswordChange
);
passwordRouter.post(
  '/confirm-password-change/:token',
  validate(confirmPasswordChangeSchema),
  passwordController.handleConfirmPasswordChange
);

export default passwordRouter;
