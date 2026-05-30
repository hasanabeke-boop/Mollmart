declare namespace NodeJS {
  export interface ProcessEnv {
    readonly NODE_ENV: 'production' | 'development' | 'test';
    readonly PORT: string;
    readonly SERVER_URL: string;
    readonly CORS_ORIGIN: string;
    readonly CORS_ORIGINS: string;
    readonly ACCESS_TOKEN_SECRET: string;
    readonly ACCESS_TOKEN_EXPIRE: string;
    readonly REFRESH_TOKEN_SECRET: string;
    readonly REFRESH_TOKEN_EXPIRE: string;
    readonly REFRESH_TOKEN_COOKIE_NAME: string;
    readonly POSTGRES_DB: string;
    readonly POSTGRES_USER: string;
    readonly POSTGRES_PASSWORD: string;
    readonly DATABASE_URL: string;
    readonly EMAIL_FROM: string;
    readonly GMAIL_API_CLIENT_ID: string;
    readonly GMAIL_API_CLIENT_SECRET: string;
    readonly GMAIL_API_REFRESH_TOKEN: string;
    readonly GMAIL_API_USER_ID: string;
  }
}
