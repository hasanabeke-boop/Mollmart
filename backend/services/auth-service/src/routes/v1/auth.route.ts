import { Router } from 'express';
import validate from '../../middleware/validate';
import isAuth from '../../middleware/isAuth';
import authorizeAdmin from '../../middleware/authorizeAdmin';
import authorizeAdminOrInternal from '../../middleware/authorizeAdminOrInternal';
import {
  adminUpdateUserSchema,
  adminUserListSchema,
  changePasswordSchema,
  introspectTokenSchema,
  loginSchema,
  signupSchema,
  userIdParamSchema
} from '../../validations/auth.validation';
import * as authController from '../../controller/auth.controller';

const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), authController.handleSignUp);

authRouter.post('/login', validate(loginSchema), authController.handleLogin);

authRouter.post('/logout', authController.handleLogout);

authRouter.post('/refresh', authController.handleRefresh);

authRouter.post('/logout-all', isAuth, authController.handleLogoutAll);

authRouter.get('/me', isAuth, authController.handleGetMe);

authRouter.patch(
  '/me/password',
  isAuth,
  validate(changePasswordSchema),
  authController.handleChangePassword
);

authRouter.post(
  '/introspect',
  authorizeAdminOrInternal,
  validate(introspectTokenSchema),
  authController.handleIntrospectToken
);

authRouter.get(
  '/users/:id',
  authorizeAdminOrInternal,
  validate(userIdParamSchema),
  authController.handleGetUserById
);

authRouter.post(
  '/users/:id/block',
  authorizeAdminOrInternal,
  validate(userIdParamSchema),
  authController.handleBlockUser
);

authRouter.post(
  '/users/:id/unblock',
  authorizeAdminOrInternal,
  validate(userIdParamSchema),
  authController.handleUnblockUser
);

authRouter.get(
  '/admin/users',
  authorizeAdmin,
  validate(adminUserListSchema),
  authController.handleAdminListUsers
);

authRouter.get(
  '/admin/users/:id',
  authorizeAdmin,
  validate(userIdParamSchema),
  authController.handleGetUserById
);

authRouter.patch(
  '/admin/users/:id',
  authorizeAdmin,
  validate(adminUpdateUserSchema),
  authController.handleAdminUpdateUser
);

authRouter.post(
  '/admin/users/:id/block',
  authorizeAdmin,
  validate(userIdParamSchema),
  authController.handleBlockUser
);

authRouter.post(
  '/admin/users/:id/unblock',
  authorizeAdmin,
  validate(userIdParamSchema),
  authController.handleUnblockUser
);

authRouter.post(
  '/admin/users/:id/revoke-sessions',
  authorizeAdmin,
  validate(userIdParamSchema),
  authController.handleAdminRevokeUserSessions
);

export default authRouter;
