import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import path from 'path';
import express, { Express } from 'express';
import helmet from 'helmet';
import authLimiter from './modules/auth/middleware/authLimiter';
import isAuth from './modules/auth/middleware/isAuth';
import { xssMiddleware } from './modules/auth/middleware/xssMiddleware';
import { authRouter, passwordRouter, verifyEmailRouter } from './modules/auth/routes/v1';
import adminRoutes from './modules/admin/routes/v1';
import chatbotRoutes from './modules/chatbot/routes/v1';
import chatRoutes from './modules/chat/routes/v1';
import notificationRoutes from './modules/notification/routes/v1';
import catalogRoutes from './modules/catalog/routes/v1';
import shopRoutes from './modules/shop/routes/v1';
import dealRoutes from './modules/deal/routes/v1';
import auctionRoutes from './modules/auction/routes/v1';
import currencyRoutes from './modules/currency/routes/v1';
import offerRoutes from './modules/offer/routes/v1';
import profileRoutes from './modules/profile/routes/v1';
import requestRoutes from './modules/request/routes/v1';
import config from './config/config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

const app: Express = express();

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

function createCorsError(origin: string): Error & { statusCode: number } {
  const error = new Error(`CORS origin not allowed: ${origin}`) as Error & { statusCode: number };
  error.statusCode = 403;
  return error;
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (origin == null) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (config.corsOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(createCorsError(origin));
  },
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xssMiddleware());
app.use(cookieParser());
app.use(compression());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mollmart-backend',
    architecture: 'modular-monolith',
    apiBasePath: '/api/v1',
    modules: ['auth', 'profile', 'request', 'offer', 'chat', 'chatbot', 'admin', 'notification', 'catalog', 'shop', 'deal']
  });
});

if (config.nodeEnv === 'production') {
  app.use('/api/v1/auth', authLimiter);
}

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', passwordRouter);
app.use('/api/v1', verifyEmailRouter);
app.use('/api/v1', adminRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', requestRoutes);
app.use('/api/v1', offerRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/v1', chatbotRoutes);
app.use('/api/v1', notificationRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/currency', currencyRoutes);
app.use('/api/v1', dealRoutes);
app.use('/api/v1', auctionRoutes);

app.get('/secret', isAuth, (_req, res) => {
  res.json({
    message: 'You can see me'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
