import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/apiError';
import logger from './logger';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('request.failed', error);

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error'
  });
}
