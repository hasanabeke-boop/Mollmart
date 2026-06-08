import { PrismaClient } from '@prisma/client';
import config from './config';

declare global {
  // eslint-disable-next-line no-var
  var mollmartPrisma: PrismaClient | undefined;
}

const prisma =
  globalThis.mollmartPrisma ??
  new PrismaClient({
    datasourceUrl: config.databaseUrl,
    log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error']
  });

if (config.nodeEnv !== 'production') {
  globalThis.mollmartPrisma = prisma;
}

export default prisma;
