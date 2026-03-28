import * as dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(4080),
  SERVER_URL: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(8).required(),
  REDIS_URL: Joi.string().uri().required(),
  REDIS_ENABLED: Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0').default(true),
  DEFAULT_PAGE_SIZE: Joi.number().integer().min(1).max(100).default(20),
  MAX_PAGE_SIZE: Joi.number().integer().min(1).max(200).default(100)
})
  .unknown()
  .required();

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true
});

if (error != null) {
  throw new Error(
    `Environment variable validation error:\n${error.details.map((detail) => detail.message).join('\n')}`
  );
}

const config = {
  nodeEnv: value.NODE_ENV as 'development' | 'production' | 'test',
  server: {
    port: Number(value.PORT),
    url: value.SERVER_URL as string
  },
  corsOrigin: value.CORS_ORIGIN as string,
  databaseUrl: value.DATABASE_URL as string,
  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET as string
  },
  redis: {
    url: value.REDIS_URL as string,
    enabled: Boolean(value.REDIS_ENABLED)
  },
  pagination: {
    defaultPageSize: Number(value.DEFAULT_PAGE_SIZE),
    maxPageSize: Number(value.MAX_PAGE_SIZE)
  }
} as const;

export default config;
