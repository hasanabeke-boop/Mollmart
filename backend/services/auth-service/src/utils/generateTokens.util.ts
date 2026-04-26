import jwt from 'jsonwebtoken';
import config from '../config/config';
import type { AuthTokenUser } from '../types/types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const { sign } = jwt;

/**
 * This functions generates a valid access token
 *
 * @param {AuthTokenUser} user - The user that owns this jwt
 * @returns Returns a valid access token
 */
export const createAccessToken = (user: AuthTokenUser): string => {
  return sign(
    {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    },
    config.jwt.access_token.secret,
    {
      expiresIn: config.jwt.access_token.expire,
      subject: user.id
    }
  );
};

/**
 * This functions generates a valid refresh token
 *
 * @param {AuthTokenUser} user - The user that owns this jwt
 * @returns Returns a valid refresh token
 */
export const createRefreshToken = (user: AuthTokenUser): string => {
  return sign(
    {
      userId: user.id,
      role: user.role,
      status: user.status
    },
    config.jwt.refresh_token.secret,
    {
      expiresIn: config.jwt.refresh_token.expire,
      subject: user.id
    }
  );
};
