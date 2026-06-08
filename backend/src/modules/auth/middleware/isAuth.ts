/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

import { verify, type JwtPayload } from 'jsonwebtoken';
import config from '../../../config/config';

const isAuth = (req: Request, res: Response, next: NextFunction) => {
  // token looks like 'Bearer vnjaknvijdaknvikbnvreiudfnvriengviewjkdsbnvierj'

  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }

  const token: string | undefined = authHeader.split(' ')[1];

  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  try {
    const payload = verify(token, config.jwt.access_token.secret) as JwtPayload;

    if (payload.userId == null && payload.sub == null) {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }

    req.payload = payload;
    next();
  } catch {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
};

export default isAuth;
