import { PrismaClient } from '@prisma/client';
import config from './config';

const prisma = new PrismaClient({
  datasourceUrl: config.databaseUrl,
  log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error']
});

export default prisma;
