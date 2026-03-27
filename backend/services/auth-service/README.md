# Auth Service

JWT-based authentication service built with Express, TypeScript, Prisma, and PostgreSQL.

This service provides:

- user signup and login
- refresh token rotation
- logout via refresh-token invalidation
- email verification flow
- forgot-password and reset-password flow
- a protected sample route for token testing

## Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Argon2
- JWT
- Nodemailer
- Docker Compose

## Project Structure

```text
backend/services/auth-service
├── prisma
│   ├── migrations
│   └── schema.prisma
├── src
│   ├── config
│   ├── controller
│   ├── middleware
│   ├── routes
│   ├── types
│   ├── utils
│   ├── validations
│   ├── app.ts
│   └── index.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## API Base URL

Local Docker default:

```text
http://localhost:4040
```

Main route groups:

- `/api/v1/auth`
- `/api/v1`

Protected test route:

- `GET /secret`

## Endpoints

### Auth

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Password

- `POST /api/v1/forgot-password`
- `POST /api/v1/reset-password/:token`

### Email Verification

- `POST /api/v1/send-verification-email`
- `POST /api/v1/verify-email/:token`

### Protected Example

- `GET /secret`

## Request Examples

All examples below assume the service is running at:

```text
http://localhost:4040
```

### 1. Signup

Request:

```http
POST /api/v1/auth/signup
Content-Type: application/json
```

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123"
}
```

Typical response:

```json
{
  "message": "New user created"
}
```

### 2. Login

Request:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```

Typical response:

```json
{
  "accessToken": "eyJ..."
}
```

Notes:

- this endpoint also sets a refresh-token cookie
- keep cookies enabled in Postman if you want to test refresh/logout

### 3. Refresh Access Token

Request:

```http
POST /api/v1/auth/refresh
```

Body:

```json
{}
```

Typical response:

```json
{
  "accessToken": "eyJ..."
}
```

### 4. Logout

Request:

```http
POST /api/v1/auth/logout
```

Body:

```json
{}
```

Typical response:

```text
204 No Content
```

### 5. Forgot Password

Request:

```http
POST /api/v1/forgot-password
Content-Type: application/json
```

```json
{
  "email": "test@example.com"
}
```

### 6. Reset Password

Request:

```http
POST /api/v1/reset-password/:token
Content-Type: application/json
```

```json
{
  "newPassword": "NewPassword123"
}
```

### 7. Send Verification Email

Request:

```http
POST /api/v1/send-verification-email
Content-Type: application/json
```

```json
{
  "email": "test@example.com"
}
```

### 8. Verify Email

Request:

```http
POST /api/v1/verify-email/:token
```

### 9. Protected Route

Request:

```http
GET /secret
Authorization: Bearer <access-token>
```

Typical response:

```json
{
  "message": "You can see me"
}
```

## Validation Rules

### Signup

- `username`: required, 2-50 chars
- `email`: required, valid email
- `password`: required, 6-150 chars

### Login

- `email`: required, valid email
- `password`: required, 6-150 chars

### Forgot Password

- `email`: required, valid email

### Reset Password

- `newPassword`: required, 6-150 chars
- `token`: route param required

### Send Verification Email

- `email`: required, valid email

### Verify Email

- `token`: route param required

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
NODE_ENV=production
PORT=4040
SERVER_URL=http://localhost:4040
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRE=20m
REFRESH_TOKEN_EXPIRE=1d
REFRESH_TOKEN_COOKIE_NAME=jid

POSTGRES_DB=authdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/authdb?schema=public

SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=
```

Important:

- when you run Prisma from your Windows host, `DATABASE_URL` should usually use `localhost` or `127.0.0.1`
- when the app runs inside Docker Compose, the database host inside the container network is `postgres`

## Local Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Watch TypeScript build:

```bash
npm run watch
```

Start development flow:

```bash
npm run dev
```

Start production script locally:

```bash
npm run start
```

## Docker

From `backend/services/auth-service`:

```bash
docker compose up --build
```

This starts:

- `auth-service` on port `4040`
- `postgres` on port `5432`

Useful commands:

```bash
docker compose up -d
docker compose down
docker ps
docker logs auth-service
docker logs postgres
```

## Database and Prisma

### Prisma Schema

The Prisma schema lives in:

- `prisma/schema.prisma`

Models:

- `User`
- `Account`
- `RefreshToken`
- `ResetToken`
- `EmailVerificationToken`

### Apply Migrations

If PostgreSQL is already running and your local `.env` points to the host port:

```bash
npx prisma migrate deploy
```

Open Prisma Studio:

```bash
npx prisma studio
```

Prisma Studio default URL:

```text
http://localhost:5555
```

## Postman Tips

- always use the full URL, for example `http://localhost:4040/api/v1/auth/signup`
- set `Content-Type: application/json`
- choose `Body -> raw -> JSON`
- keep cookies enabled to test refresh and logout
- copy the returned `accessToken` into the `Authorization` header for `/secret`

## Security Behavior

This service uses:

- Argon2 password hashing
- JWT access and refresh tokens
- HTTP-only refresh token cookies
- refresh token rotation
- CORS
- Helmet
- request body sanitization
- rate limiting on auth routes in production

## Scripts

```bash
npm run build
npm run dev
npm run watch
npm run start
npm run lint
npm run lint:fix
npm run prettier:check
npm run prettier:format
npm run test
npm run test:watch
npm run coverage
```

## Known Notes

- the service currently depends on older Prisma and Node-related tooling, so running Prisma commands is usually easiest either from a compatible local Node version or from a Docker-based workflow
- refresh cookies are configured as `SameSite=None` and `secure=true`, which is correct for HTTPS deployments but may affect some local testing setups
- email-related flows require valid SMTP settings in `.env`

## License

MIT
