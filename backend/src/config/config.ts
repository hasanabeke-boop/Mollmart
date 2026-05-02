import * as dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(4040),
  SERVER_URL: Joi.string().uri().default('http://localhost:4040'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  DATABASE_URL: Joi.string().required(),
  POSTGRES_DB: Joi.string().optional(),
  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().optional(),
  JWT_ACCESS_SECRET: Joi.string().min(8).optional(),
  ACCESS_TOKEN_SECRET: Joi.string().min(8).optional(),
  JWT_REFRESH_SECRET: Joi.string().min(8).optional(),
  REFRESH_TOKEN_SECRET: Joi.string().min(8).optional(),
  ACCESS_TOKEN_EXPIRE: Joi.string().default('20m'),
  REFRESH_TOKEN_EXPIRE: Joi.string().default('1d'),
  REFRESH_TOKEN_COOKIE_NAME: Joi.string().default('jid'),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  REDIS_ENABLED: Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0').default(true),
  DEFAULT_PAGE_SIZE: Joi.number().integer().min(1).max(100).default(20),
  MAX_PAGE_SIZE: Joi.number().integer().min(1).max(200).default(100),
  ALLOW_MULTIPLE_ACTIVE_OFFERS_PER_REQUEST: Joi.boolean()
    .truthy('true')
    .truthy('1')
    .falsy('false')
    .falsy('0')
    .default(false),
  SUBSCRIBE_MODERATION_EVENTS: Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0').default(true),
  SMTP_HOST: Joi.string().default('smtp.example.com'),
  SMTP_PORT: Joi.string().default('587'),
  SMTP_USERNAME: Joi.string().default('user@example.com'),
  SMTP_PASSWORD: Joi.string().default('password'),
  EMAIL_FROM: Joi.string().email().default('no-reply@example.com'),
  INTERNAL_API_TOKEN: Joi.string().allow('').default('')
})
  .custom((value, helpers) => {
    if (value.JWT_ACCESS_SECRET == null && value.ACCESS_TOKEN_SECRET == null) {
      return helpers.error('any.custom', {
        message: 'JWT_ACCESS_SECRET or ACCESS_TOKEN_SECRET is required'
      });
    }

    if (value.JWT_REFRESH_SECRET == null && value.REFRESH_TOKEN_SECRET == null) {
      return helpers.error('any.custom', {
        message: 'JWT_REFRESH_SECRET or REFRESH_TOKEN_SECRET is required'
      });
    }

    return value;
  })
  .unknown()
  .required();

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true
});

if (error != null) {
  throw new Error(
    `Environment variable validation error:\n${error.details.map((detail) => detail.context?.message ?? detail.message).join('\n')}`
  );
}

const accessSecret = (value.JWT_ACCESS_SECRET ?? value.ACCESS_TOKEN_SECRET) as string;
const refreshSecret = (value.JWT_REFRESH_SECRET ?? value.REFRESH_TOKEN_SECRET) as string;
const nodeEnv = value.NODE_ENV as 'development' | 'production' | 'test';

const config = {
  nodeEnv,
  node_env: nodeEnv,
  server: {
    port: Number(value.PORT),
    url: value.SERVER_URL as string
  },
  corsOrigin: value.CORS_ORIGIN as string,
  cors: {
    cors_origin: value.CORS_ORIGIN as string
  },
  databaseUrl: value.DATABASE_URL as string,
  jwt: {
    accessSecret,
    access_token: {
      secret: accessSecret,
      expire: value.ACCESS_TOKEN_EXPIRE as string
    },
    refresh_token: {
      secret: refreshSecret,
      expire: value.REFRESH_TOKEN_EXPIRE as string,
      cookie_name: value.REFRESH_TOKEN_COOKIE_NAME as string
    }
  },
  redis: {
    url: value.REDIS_URL as string,
    enabled: Boolean(value.REDIS_ENABLED)
  },
  pagination: {
    defaultPageSize: Number(value.DEFAULT_PAGE_SIZE),
    maxPageSize: Number(value.MAX_PAGE_SIZE)
  },
  offers: {
    allowMultipleActivePerRequest: Boolean(value.ALLOW_MULTIPLE_ACTIVE_OFFERS_PER_REQUEST)
  },
  subscriptions: {
    moderationEvents: Boolean(value.SUBSCRIBE_MODERATION_EVENTS)
  },
  email: {
    enabled:
      value.SMTP_HOST !== 'smtp.example.com' &&
      value.SMTP_USERNAME !== 'user@example.com' &&
      value.SMTP_PASSWORD !== 'password',
    smtp: {
      host: value.SMTP_HOST as string,
      port: value.SMTP_PORT as string,
      auth: {
        username: value.SMTP_USERNAME as string,
        password: value.SMTP_PASSWORD as string
      }
    },
    from: value.EMAIL_FROM as string
  },
  internal: {
    api_token: value.INTERNAL_API_TOKEN as string
  },
  requestService: {
    url: `${value.SERVER_URL}/api/v1`,
    timeoutMs: 5000
  },
  offerService: {
    url: `${value.SERVER_URL}/api/v1`,
    timeoutMs: 5000
  }
} as const;

export default config;
