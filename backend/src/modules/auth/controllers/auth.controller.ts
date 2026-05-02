import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { verify, type JwtPayload } from 'jsonwebtoken';
import prismaClient from '../../../config/prisma';
import type {
  AdminUpdateUserRequestBody,
  AuthTokenUser,
  ChangePasswordRequestBody,
  TokenIntrospectionRequestBody,
  TypedRequest,
  UserLoginCredentials,
  UserSignUpCredentials
} from '../types/types';
import {
  createAccessToken,
  createRefreshToken
} from '../utils/generateTokens.util';
import config from '../../../config/config';

import {
  clearRefreshTokenCookieConfig,
  refreshTokenCookieConfig
} from '../config/cookieConfig';

import { sendVerifyEmail } from '../utils/sendEmail.util';
import logger from '../../../middleware/logger';

const buildTokenUser = (user: {
  id: string;
  name: string;
  email: string | null;
  role: 'buyer' | 'seller' | 'admin';
  status: 'active' | 'blocked' | 'suspended';
}): AuthTokenUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status
});

const serializeUser = (user: {
  id: string;
  name: string;
  email: string | null;
  role: 'buyer' | 'seller' | 'admin';
  status: 'active' | 'blocked' | 'suspended';
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt
});

const resolvePayloadUserId = (payload?: JwtPayload): string | undefined =>
  payload?.sub ?? payload?.userId;

const activeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true
} as const;

const adminUserOrderBy = {
  createdAt: 'desc'
} as const;

const sendAccountStatusError = (res: Response, status: string) => {
  if (status === 'blocked') {
    return res
      .status(httpStatus.FORBIDDEN)
      .json({ message: 'Your account is blocked' });
  }

  if (status === 'suspended') {
    return res
      .status(httpStatus.FORBIDDEN)
      .json({ message: 'Your account is suspended' });
  }

  return null;
};

const createVerificationToken = async (userId: string): Promise<string> => {
  await prismaClient.emailVerificationToken.deleteMany({
    where: { userId }
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 3600000);

  await prismaClient.emailVerificationToken.create({
    data: {
      token,
      expiresAt,
      userId
    }
  });

  return token;
};

/**
 * This function handles the signup process for new users. It expects a request object with the following properties:
 *
 * @param {TypedRequest<UserSignUpCredentials>} req - The request object that includes user's username, email, and password.
 * @param {Response} res - The response object that will be used to send the HTTP response.
 *
 * @returns {Response} Returns an HTTP response that includes one of the following:
 *   - A 400 BAD REQUEST status code and an error message if the request body is missing any required parameters.
 *   - A 409 CONFLICT status code if the user email already exists in the database.
 *   - A 201 CREATED status code and a success message if the new user is successfully created and a verification email is sent.
 *   - A 500 INTERNAL SERVER ERROR status code if there is an error in the server.
 */
export const handleSignUp = async (
  req: TypedRequest<UserSignUpCredentials>,
  res: Response
) => {
  const { username, email, password, role = 'buyer' } = req.body;

  // check req.body values
  if (!username || !email || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Username, email and password are required!'
    });
  }

  const checkUserEmail = await prismaClient.user.findUnique({
    where: {
      email
    }
  });

  if (checkUserEmail) {
    if (checkUserEmail.emailVerified) {
      return res.status(httpStatus.CONFLICT).json({
        message: 'A verified user with this email already exists'
      });
    }

    try {
      const hashedPassword = await argon2.hash(password);

      await prismaClient.user.update({
        where: { id: checkUserEmail.id },
        data: {
          name: username,
          password: hashedPassword,
          role
        }
      });

      const token = await createVerificationToken(checkUserEmail.id);
      const emailSent = await sendVerifyEmail(email, token);

      return res.status(httpStatus.OK).json(
        emailSent
          ? {
              message:
                'User already exists but is not verified. A new verification email was sent.'
            }
          : {
              message:
                'User already exists but is not verified. Verification email is disabled.',
              verificationToken: token
            }
      );
    } catch (err) {
      logger.error(err);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to recreate verification state for existing user'
      });
    }
  }

  try {
    const hashedPassword = await argon2.hash(password);

    const newUser = await prismaClient.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role
      }
    });

    const token = await createVerificationToken(newUser.id);

    // Send an email with the verification link
    const emailSent = await sendVerifyEmail(email, token);

    return res.status(httpStatus.CREATED).json(
      emailSent
        ? { message: 'New user created' }
        : {
            message: 'New user created. Verification email is disabled.',
            verificationToken: token
          }
    );
  } catch (err) {
    logger.error(err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to create user'
    });
  }
};

/**
 * This function handles the login process for users. It expects a request object with the following properties:
 *
 * @param {TypedRequest<UserLoginCredentials>} req - The request object that includes user's email and password.
 * @param {Response} res - The response object that will be used to send the HTTP response.
 *
 * @returns {Response} Returns an HTTP response that includes one of the following:
 *   - A 400 BAD REQUEST status code and an error message if the request body is missing any required parameters.
 *   - A 401 UNAUTHORIZED status code if the user email does not exist in the database or the email is not verified or the password is incorrect.
 *   - A 200 OK status code and an access token if the login is successful and a new refresh token is stored in the database and a new refresh token cookie is set.
 *   - A 500 INTERNAL SERVER ERROR status code if there is an error in the server.
 */
export const handleLogin = async (
  req: TypedRequest<UserLoginCredentials>,
  res: Response
) => {
  const cookies = req.cookies;
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Email and password are required!' });
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email
    }
  });

  // check password
  try {
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Invalid email or password!'
      });
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    // Check if email is verified
    // Check for verified email after verifying the password to prevent user enumeration attacks
    if (!user.emailVerified) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Your email is not verified! Please confirm your email!'
      });
    }

    // If password is invalid, return unauthorized
    if (!isPasswordValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Invalid email or password!'
      });
    }

    const statusResponse = sendAccountStatusError(res, user.status);
    if (statusResponse != null) {
      return statusResponse;
    }

    // if there is a refresh token in the req.cookie, then we need to check if this
    // refresh token exists in the database and belongs to the current user than we need to delete it
    // if the token does not belong to the current user, then we delete all refresh tokens
    // of the user stored in the db to be on the safe site
    // we also clear the cookie in both cases
    if (cookies?.[config.jwt.refresh_token.cookie_name]) {
      // check if the given refresh token is from the current user
      const checkRefreshToken = await prismaClient.refreshToken.findUnique({
        where: {
          token: cookies[config.jwt.refresh_token.cookie_name]
        }
      });

      // if this token does not exists int the database or belongs to another user,
      // then we clear all refresh tokens from the user in the db
      if (!checkRefreshToken || checkRefreshToken.userId !== user.id) {
        await prismaClient.refreshToken.deleteMany({
          where: {
            userId: user.id
          }
        });
      } else {
        // else everything is fine and we just need to delete the one token
        await prismaClient.refreshToken.delete({
          where: {
            token: cookies[config.jwt.refresh_token.cookie_name]
          }
        });
      }

      // also clear the refresh token in the cookie
      res.clearCookie(
        config.jwt.refresh_token.cookie_name,
        clearRefreshTokenCookieConfig
      );
    }

    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    });

    const tokenUser = buildTokenUser(user);
    const accessToken = createAccessToken(tokenUser);
    const newRefreshToken = createRefreshToken(tokenUser);

    // store new refresh token in db
    await prismaClient.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id
      }
    });

    // save refresh token in cookie
    res.cookie(
      config.jwt.refresh_token.cookie_name,
      newRefreshToken,
      refreshTokenCookieConfig
    );

    // send access token per json to user so it can be stored in the localStorage
    return res.json({ accessToken });
  } catch (err) {
    logger.error(err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Login failed'
    });
  }
};

/**
 * This function handles the logout process for users. It expects a request object with the following properties:
 *
 * @param {TypedRequest} req - The request object that includes a cookie with a valid refresh token
 * @param {Response} res - The response object that will be used to send the HTTP response.
 *
 * @returns {Response} Returns an HTTP response that includes one of the following:
 *   - A 204 NO CONTENT status code if the refresh token cookie is undefined
 *   - A 204 NO CONTENT status code if the refresh token does not exists in the database
 *   - A 204 NO CONTENT status code if the refresh token cookie is successfully cleared
 */
export const handleLogout = async (req: TypedRequest, res: Response) => {
  const cookies = req.cookies;

  if (!cookies[config.jwt.refresh_token.cookie_name]) {
    return res.sendStatus(httpStatus.NO_CONTENT); // No content
  }
  const refreshToken = cookies[config.jwt.refresh_token.cookie_name];

  // Is refreshToken in db?
  const foundRft = await prismaClient.refreshToken.findUnique({
    where: { token: refreshToken }
  });

  if (!foundRft) {
    res.clearCookie(
      config.jwt.refresh_token.cookie_name,
      clearRefreshTokenCookieConfig
    );
    return res.sendStatus(httpStatus.NO_CONTENT);
  }

  // Delete refreshToken in db
  await prismaClient.refreshToken.delete({
    where: { token: refreshToken }
  });

  res.clearCookie(
    config.jwt.refresh_token.cookie_name,
    clearRefreshTokenCookieConfig
  );
  return res.sendStatus(httpStatus.NO_CONTENT);
};

export const handleLogoutAll = async (req: TypedRequest, res: Response) => {
  const userId = resolvePayloadUserId(req.payload);

  if (userId == null) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }

  await prismaClient.refreshToken.deleteMany({
    where: { userId }
  });

  res.clearCookie(
    config.jwt.refresh_token.cookie_name,
    clearRefreshTokenCookieConfig
  );

  return res.sendStatus(httpStatus.NO_CONTENT);
};

export const handleGetMe = async (req: TypedRequest, res: Response) => {
  const userId = resolvePayloadUserId(req.payload);

  if (userId == null) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }

  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: activeUserSelect
  });

  if (user == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  return res.status(httpStatus.OK).json({
    user: serializeUser(user)
  });
};

export const handleChangePassword = async (
  req: TypedRequest<ChangePasswordRequestBody>,
  res: Response
) => {
  const userId = resolvePayloadUserId(req.payload);
  const { currentPassword, newPassword } = req.body;

  if (userId == null) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }

  if (!currentPassword || !newPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Current password and new password are required'
    });
  }

  const user = await prismaClient.user.findUnique({
    where: { id: userId }
  });

  if (user == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  const isPasswordValid = await argon2.verify(user.password, currentPassword);

  if (!isPasswordValid) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: 'Current password is incorrect'
    });
  }

  const hashedPassword = await argon2.hash(newPassword);

  await prismaClient.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword
    }
  });

  await prismaClient.refreshToken.deleteMany({
    where: { userId }
  });

  res.clearCookie(
    config.jwt.refresh_token.cookie_name,
    clearRefreshTokenCookieConfig
  );

  return res.status(httpStatus.OK).json({
    message: 'Password updated successfully'
  });
};

export const handleIntrospectToken = async (
  req: TypedRequest<TokenIntrospectionRequestBody>,
  res: Response
) => {
  const { token } = req.body;

  if (!token) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Token is required'
    });
  }

  try {
    const payload = verify(
      token,
      config.jwt.access_token.secret
    ) as JwtPayload;
    const userId = payload.sub ?? payload.userId;

    if (userId == null) {
      return res.status(httpStatus.OK).json({ active: false });
    }

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: activeUserSelect
    });

    return res.status(httpStatus.OK).json({
      active: user != null && user.status === 'active',
      user: user == null ? null : serializeUser(user),
      claims: {
        sub: payload.sub ?? userId,
        userId,
        role: user?.role ?? payload.role,
        status: user?.status ?? payload.status
      }
    });
  } catch {
    return res.status(httpStatus.OK).json({ active: false });
  }
};

export const handleGetUserById = async (req: TypedRequest, res: Response) => {
  const user = await prismaClient.user.findUnique({
    where: { id: req.params['id'] as string },
    select: activeUserSelect
  });

  if (user == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  return res.status(httpStatus.OK).json({
    user: serializeUser(user)
  });
};

export const handleAdminListUsers = async (req: TypedRequest, res: Response) => {
  const search =
    typeof req.query['search'] === 'string' ? req.query['search'].trim() : '';
  const role =
    typeof req.query['role'] === 'string' ? req.query['role'] : undefined;
  const status =
    typeof req.query['status'] === 'string' ? req.query['status'] : undefined;

  const users = await prismaClient.user.findMany({
    where: {
      ...(search.length > 0
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(role != null ? { role: role as 'buyer' | 'seller' | 'admin' } : {}),
      ...(status != null ? { status: status as 'active' | 'blocked' | 'suspended' } : {})
    },
    select: activeUserSelect,
    orderBy: adminUserOrderBy
  });

  return res.status(httpStatus.OK).json({
    users: users.map(serializeUser)
  });
};

export const handleAdminUpdateUser = async (
  req: TypedRequest<AdminUpdateUserRequestBody>,
  res: Response
) => {
  const userId = req.params['id'] as string;
  const { name, email, role, status } = req.body;
  const actingUserId = resolvePayloadUserId(req.payload);

  if (actingUserId === userId && role != null && role !== 'admin') {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Admin users cannot remove their own admin role'
    });
  }

  const existingUser = await prismaClient.user.findUnique({
    where: { id: userId }
  });

  if (existingUser == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  if (email != null && email !== existingUser.email) {
    const emailOwner = await prismaClient.user.findUnique({
      where: { email }
    });

    if (emailOwner != null && emailOwner.id !== userId) {
      return res.status(httpStatus.CONFLICT).json({
        message: 'A user with this email already exists'
      });
    }
  }

  const user = await prismaClient.user.update({
    where: { id: userId },
    data: {
      ...(name != null ? { name } : {}),
      ...(email != null ? { email } : {}),
      ...(role != null ? { role } : {}),
      ...(status != null ? { status } : {})
    },
    select: activeUserSelect
  });

  if (status === 'blocked' || status === 'suspended') {
    await prismaClient.refreshToken.deleteMany({
      where: { userId }
    });
  }

  return res.status(httpStatus.OK).json({
    user: serializeUser(user)
  });
};

export const handleBlockUser = async (req: TypedRequest, res: Response) => {
  const userId = req.params['id'] as string;

  const user = await prismaClient.user.update({
    where: { id: userId },
    data: {
      status: 'blocked'
    },
    select: activeUserSelect
  }).catch(() => null);

  if (user == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  await prismaClient.refreshToken.deleteMany({
    where: { userId }
  });

  return res.status(httpStatus.OK).json({
    user: serializeUser(user)
  });
};

export const handleUnblockUser = async (req: TypedRequest, res: Response) => {
  const user = await prismaClient.user.update({
    where: { id: req.params['id'] as string },
    data: {
      status: 'active'
    },
    select: activeUserSelect
  }).catch(() => null);

  if (user == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  return res.status(httpStatus.OK).json({
    user: serializeUser(user)
  });
};

export const handleAdminRevokeUserSessions = async (
  req: TypedRequest,
  res: Response
) => {
  const userId = req.params['id'] as string;
  const user = await prismaClient.user.findUnique({
    where: { id: userId }
  });

  if (user == null) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }

  const deleted = await prismaClient.refreshToken.deleteMany({
    where: { userId }
  });

  return res.status(httpStatus.OK).json({
    message: 'User sessions revoked',
    revokedRefreshTokens: deleted.count
  });
};

/**
 * This function handles the refresh process for users. It expects a request object with the following properties:
 *
 * @param {Request} req - The request object that includes a cookie with a valid refresh token
 * @param {Response} res - The response object that will be used to send the HTTP response.
 *
 * @returns {Response} Returns an HTTP response that includes one of the following:
 *   - A 401 UNAUTHORIZED status code if the refresh token cookie is undefined
 *   - A 403 FORBIDDEN status code if a refresh token reuse was detected but the token wasn't valid
 *   - A 403 FORBIDDEN status code if a refresh token reuse was detected but the token was valid
 *   - A 403 FORBIDDEN status code if the token wasn't valid
 *   - A 200 OK status code if the token was valid and the user was granted a new refresh and access token
 */
export const handleRefresh = async (req: Request, res: Response) => {
  const refreshToken: string | undefined =
    req.cookies[config.jwt.refresh_token.cookie_name];

  if (!refreshToken) return res.sendStatus(httpStatus.UNAUTHORIZED);

  // clear refresh cookie
  res.clearCookie(
    config.jwt.refresh_token.cookie_name,
    clearRefreshTokenCookieConfig
  );

  // check if refresh token is in db
  const foundRefreshToken = await prismaClient.refreshToken.findUnique({
    where: {
      token: refreshToken
    }
  });

  // Detected refresh token reuse!
  if (!foundRefreshToken) {
    try {
      const payload = verify(refreshToken, config.jwt.refresh_token.secret) as JwtPayload;
      const reusedUserId = payload.sub ?? payload.userId;

      logger.warn('Attempted refresh token reuse!');

      if (reusedUserId != null) {
        // Delete all tokens of the user because we detected that a token was stolen from him
        await prismaClient.refreshToken.deleteMany({
          where: {
            userId: reusedUserId
          }
        });
      }
    } catch {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }

    return res.sendStatus(httpStatus.FORBIDDEN);
  }

  // delete from db
  await prismaClient.refreshToken.delete({
    where: {
      token: refreshToken
    }
  });

  let payload: JwtPayload;

  try {
    payload = verify(refreshToken, config.jwt.refresh_token.secret) as JwtPayload;
  } catch {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }

  const userId = payload.sub ?? payload.userId;

  if (userId == null || foundRefreshToken.userId !== userId) {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }

  const user = await prismaClient.user.findUnique({
    where: { id: userId }
  });

  if (user == null) {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }

  const statusResponse = sendAccountStatusError(res, user.status);
  if (statusResponse != null) {
    return statusResponse;
  }

  // Refresh token was still valid
  const tokenUser = buildTokenUser(user);
  const accessToken = createAccessToken(tokenUser);
  const newRefreshToken = createRefreshToken(tokenUser);

  // add refresh token to db
  await prismaClient.refreshToken
    .create({
      data: {
        token: newRefreshToken,
        userId
      }
    })
    .catch((err: Error) => {
      logger.error(err);
    });

  // Creates Secure Cookie with refresh token
  res.cookie(
    config.jwt.refresh_token.cookie_name,
    newRefreshToken,
    refreshTokenCookieConfig
  );

  return res.json({ accessToken });
};
