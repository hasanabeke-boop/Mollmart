import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import config from './config/config';
import routes from './routes/v1';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { notFoundHandler } from './middleware/notFound';

const app: Express = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'offer-service'
  });
});

app.use('/api/v1', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
