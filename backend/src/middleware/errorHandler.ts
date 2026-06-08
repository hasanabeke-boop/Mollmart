import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from './logger';

interface HttpError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(httpStatus.NOT_FOUND).json({
    message: 'Route not found'
  });
}

export function errorHandler(error: HttpError, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('request.failed', error);

  if (typeof error.statusCode === 'number') {
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
