import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../config/config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const { verify } = jwt;

const authorizeAdminOrInternal = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const internalToken = req.header('x-internal-token');

  if (
    config.internal.api_token.length > 0 &&
    internalToken === config.internal.api_token
  ) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.sendStatus(httpStatus.UNAUTHORIZED);
    return;
  }

  const token = authHeader.split(' ')[1];
  if (token == null || token.length === 0) {
    res.sendStatus(httpStatus.UNAUTHORIZED);
    return;
  }

  verify(
    token,
    config.jwt.access_token.secret,
    (err: unknown, payload: JwtPayload) => {
      if (err) {
        res.sendStatus(httpStatus.FORBIDDEN);
        return;
      }

      if (payload.role !== 'admin') {
        res.sendStatus(httpStatus.FORBIDDEN);
        return;
      }

      req.payload = payload;
      next();
    }
  );
};

export default authorizeAdminOrInternal;
