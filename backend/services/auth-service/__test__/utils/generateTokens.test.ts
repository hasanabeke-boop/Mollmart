import jwt from 'jsonwebtoken';
import config from '../../src/config/config';
import {
  createAccessToken,
  createRefreshToken
} from '../../src/utils/generateTokens.util';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const { verify } = jwt;

describe('generateTokens util', () => {
  it('creates an access token with a userId payload', () => {
    const token = createAccessToken({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'buyer',
      status: 'active'
    });
    const payload = verify(
      token,
      config.jwt.access_token.secret
    ) as jwt.JwtPayload;

    expect(payload.userId).toBe('user-123');
    expect(payload.role).toBe('buyer');
    expect(payload.email).toBe('test@example.com');
  });

  it('creates a refresh token with a userId payload', () => {
    const token = createRefreshToken({
      id: 'user-456',
      name: 'Seller User',
      email: 'seller@example.com',
      role: 'seller',
      status: 'active'
    });
    const payload = verify(
      token,
      config.jwt.refresh_token.secret
    ) as jwt.JwtPayload;

    expect(payload.userId).toBe('user-456');
    expect(payload.role).toBe('seller');
  });
});
