import { Router } from 'express';
import validate from '../../middleware/validate';
import isAuth from '../../middleware/isAuth';
import {
  changePasswordSchema,
  confirmPasswordChangeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema
} from '../../validators/password.validation';
import * as passwordController from '../../controllers/forgotPassword.controller';

const passwordRouter = Router();

passwordRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  passwordController.handleForgotPassword
);
passwordRouter.get(
  '/reset-password/:token',
  validate(resetPasswordTokenSchema),
  passwordController.renderResetPasswordPage
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
