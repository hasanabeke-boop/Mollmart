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
  CORS_ORIGIN: Joi.string().optional().allow(''),
  CORS_ORIGINS: Joi.string().optional().allow(''),
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
  REQUIRE_EMAIL_VERIFICATION: Joi.string()
    .lowercase()
    .valid('auto', 'true', 'false', '1', '0')
    .default('auto'),
  SMTP_HOST: Joi.string().default('smtp.example.com'),
  SMTP_PORT: Joi.string().default('587'),
  SMTP_USERNAME: Joi.string().default('user@example.com'),
  SMTP_PASSWORD: Joi.string().default('password'),
  EMAIL_FROM: Joi.string().email().default('no-reply@example.com'),
  INTERNAL_API_TOKEN: Joi.string().allow('').default(''),
  OPENAI_API_KEY: Joi.string().allow('').default(''),
  OPENAI_MODEL: Joi.string().default('gpt-5-mini'),
  R2_ENDPOINT: Joi.string().uri().optional().allow(''),
  R2_BUCKET: Joi.string().trim().optional().allow(''),
  R2_ACCESS_KEY_ID: Joi.string().optional().allow(''),
  R2_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
  R2_PUBLIC_BASE_URL: Joi.string().uri().optional().allow('')
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
  .custom((value, helpers) => {
    const configuredCorsOrigins = [
      value.CORS_ORIGIN,
      value.CORS_ORIGINS
    ]
      .flatMap((raw: string | undefined) => (raw ?? '').split(','))
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);

    if (value.NODE_ENV !== 'production') {
      return value;
    }

    const productionUrls = [
      value.SERVER_URL,
      ...configuredCorsOrigins
    ]
      .map((url: string) => url.trim().toLowerCase())
      .filter((url: string) => url.length > 0);

    if (configuredCorsOrigins.length === 0) {
      return helpers.error('any.custom', {
        message: 'Production CORS_ORIGIN or CORS_ORIGINS is required'
      });
    }

    const hasLocalhost = productionUrls.some(
      (url: string) => url.includes('localhost') || url.includes('127.0.0.1')
    );

    if (hasLocalhost) {
      return helpers.error('any.custom', {
        message: 'Production SERVER_URL/CORS_ORIGIN/CORS_ORIGINS must not point to localhost'
      });
    }

    return value;
  })
  .custom((value, helpers) => {
    const parts = [
      value.R2_ENDPOINT,
      value.R2_BUCKET,
      value.R2_ACCESS_KEY_ID,
      value.R2_SECRET_ACCESS_KEY,
      value.R2_PUBLIC_BASE_URL
    ].map((v: string | undefined) => (typeof v === 'string' ? v.trim() : ''));
    const set = parts.filter((p) => p.length > 0).length;
    if (set !== 0 && set !== 5) {
      return helpers.error('any.custom', {
        message: 'R2: set all of R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL, or leave all empty for local disk uploads'
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
const emailEnabled =
  value.SMTP_HOST !== 'smtp.example.com' &&
  value.SMTP_USERNAME !== 'user@example.com' &&
  value.SMTP_PASSWORD !== 'password';
const requireEmailVerificationSetting = value.REQUIRE_EMAIL_VERIFICATION as string;
/** `auto`: always require email verification; use `false` or `0` only to disable (e.g. tests). */
const requireEmailVerification =
  requireEmailVerificationSetting === 'auto'
    ? true
    : requireEmailVerificationSetting === 'true' ||
      requireEmailVerificationSetting === '1';

function normalizeR2Endpoint(raw: string): string {
  try {
    const u = new URL(raw.trim());
    if (u.pathname !== '/' && u.pathname !== '') {
      u.pathname = '';
    }
    return u.origin;
  } catch {
    return raw.trim().replace(/\/$/, '');
  }
}

const r2Endpoint = (value.R2_ENDPOINT as string | undefined)?.trim() ?? '';
const r2Bucket = (value.R2_BUCKET as string | undefined)?.trim() ?? '';
const r2AccessKeyId = (value.R2_ACCESS_KEY_ID as string | undefined)?.trim() ?? '';
const r2SecretAccessKey = (value.R2_SECRET_ACCESS_KEY as string | undefined)?.trim() ?? '';
const r2PublicBaseUrl = (value.R2_PUBLIC_BASE_URL as string | undefined)?.trim() ?? '';
const r2Enabled =
  r2Endpoint.length > 0 &&
  r2Bucket.length > 0 &&
  r2AccessKeyId.length > 0 &&
  r2SecretAccessKey.length > 0 &&
  r2PublicBaseUrl.length > 0;

const corsOrigins = [
  value.CORS_ORIGIN as string,
  value.CORS_ORIGINS as string | undefined
]
  .flatMap((raw) => (raw ?? '').split(','))
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter((origin, index, all) => origin.length > 0 && all.indexOf(origin) === index);

if (corsOrigins.length === 0 && nodeEnv !== 'production') {
  corsOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

const config = {
  nodeEnv,
  node_env: nodeEnv,
  server: {
    port: Number(value.PORT),
    url: value.SERVER_URL as string
  },
  corsOrigin: corsOrigins[0] ?? '',
  corsOrigins,
  cors: {
    cors_origin: value.CORS_ORIGIN as string,
    cors_origins: corsOrigins
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
  auth: {
    requireEmailVerification
  },
  email: {
    enabled: emailEnabled,
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
  openai: {
    apiKey: value.OPENAI_API_KEY as string,
    model: value.OPENAI_MODEL as string
  },
  requestService: {
    url: `${value.SERVER_URL}/api/v1`,
    timeoutMs: 5000
  },
  offerService: {
    url: `${value.SERVER_URL}/api/v1`,
    timeoutMs: 5000
  },
  r2: r2Enabled
    ? {
        enabled: true as const,
        endpoint: normalizeR2Endpoint(r2Endpoint),
        bucket: r2Bucket,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
        publicBaseUrl: r2PublicBaseUrl.replace(/\/$/, '')
      }
    : { enabled: false as const }
} as const;

export default config;
