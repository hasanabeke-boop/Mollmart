import { Router } from 'express';
import validate from '../../middleware/validate';
import {
  sendVerifyEmailSchema,
  verifyEmailSchema
} from '../../validators/verifyEmail.validation';
import * as emailController from '../../controllers/verifyEmail.controller';

const verifyEmailRouter = Router();

verifyEmailRouter.post(
  '/send-verification-email',
  validate(sendVerifyEmailSchema),
  emailController.sendVerificationEmail
);

verifyEmailRouter.post(
  '/verify-email/:token',
  validate(verifyEmailSchema),
  emailController.handleVerifyEmail
);

verifyEmailRouter.get(
  '/verify-email/:token',
  validate(verifyEmailSchema),
  emailController.handleVerifyEmail
);

export default verifyEmailRouter;
