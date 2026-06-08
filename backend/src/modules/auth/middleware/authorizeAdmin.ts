import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { verify, type JwtPayload } from 'jsonwebtoken';
import config from '../../../config/config';

const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
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

  try {
    const payload = verify(token, config.jwt.access_token.secret) as JwtPayload;

    if (payload.role !== 'admin') {
      res.sendStatus(httpStatus.FORBIDDEN);
      return;
    }

    req.payload = payload;
    next();
  } catch {
    res.sendStatus(httpStatus.FORBIDDEN);
  }
};

export default authorizeAdmin;
