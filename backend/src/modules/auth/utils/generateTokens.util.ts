import { sign, type SignOptions } from 'jsonwebtoken';
import config from '../../../config/config';
import type { AuthTokenUser } from '../types/types';

const tokenOptions = (expiresIn: string, subject: string): SignOptions => ({
  expiresIn: expiresIn as SignOptions['expiresIn'],
  subject
});

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
    tokenOptions(config.jwt.access_token.expire, user.id)
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
    tokenOptions(config.jwt.refresh_token.expire, user.id)
  );
};
