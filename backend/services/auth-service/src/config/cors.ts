import { type CorsOptionsDelegate } from 'cors';
import type { Request } from 'express';
import config from './config';

const whitelist = String(config.cors.cors_origin).split('|') ?? [];
const serverOrigin = new URL(config.server.url).origin;

const isPublicBrowserRoute = (req: Request): boolean =>
  /^\/api\/v1\/reset-password\/[^/]+$/.test(req.path) ||
  /^\/api\/v1\/verify-email\/[^/]+$/.test(req.path);

const corsConfig: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.header('Origin');
  const isAllowedOrigin =
    origin == null ||
    origin === serverOrigin ||
    whitelist.some((val) => origin.match(val));

  if (isAllowedOrigin || isPublicBrowserRoute(req)) {
    callback(null, {
      origin: true,
      maxAge: 86400,
      allowedHeaders: [
        'Accept',
        'Authorization',
        'Content-Type',
        'If-None-Match',
        'BX-User-Token',
        'Trace-Id'
      ],
      exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
      credentials: true
    });
    return;
  }

  callback(new Error('Not allowed by CORS'));
};

export default corsConfig;
