import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import authLimiter from './modules/auth/middleware/authLimiter';
import isAuth from './modules/auth/middleware/isAuth';
import { xssMiddleware } from './modules/auth/middleware/xssMiddleware';
import { authRouter, passwordRouter, verifyEmailRouter } from './modules/auth/routes/v1';
import adminRoutes from './modules/admin/routes/v1';
import chatRoutes from './modules/chat/routes/v1';
import notificationRoutes from './modules/notification/routes/v1';
import offerRoutes from './modules/offer/routes/v1';
import profileRoutes from './modules/profile/routes/v1';
import requestRoutes from './modules/request/routes/v1';
import config from './config/config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

const app: Express = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xssMiddleware());
app.use(cookieParser());
app.use(compression());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mollmart-backend',
    architecture: 'modular-monolith',
    modules: ['auth', 'profile', 'request', 'offer', 'chat', 'admin', 'notification']
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
app.use('/api/v1', notificationRoutes);

app.get('/secret', isAuth, (_req, res) => {
  res.json({
    message: 'You can see me'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
