import { NextFunction, Request, Response } from 'express';
import { createLogger, format, transports } from 'winston';
import config from '../config/config';

const logger = createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [new transports.Console()]
});

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('request.completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id
    });
  });

  next();
}

export default logger;
