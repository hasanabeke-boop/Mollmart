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
    const token = createAccessToken('user-123');
    const payload = verify(
      token,
      config.jwt.access_token.secret
    ) as jwt.JwtPayload;

    expect(payload.userId).toBe('user-123');
  });

  it('creates a refresh token with a userId payload', () => {
    const token = createRefreshToken('user-456');
    const payload = verify(
      token,
      config.jwt.refresh_token.secret
    ) as jwt.JwtPayload;

    expect(payload.userId).toBe('user-456');
  });
});
