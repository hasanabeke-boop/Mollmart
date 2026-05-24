# Backend

The backend is now a modular monolith.

Database support is PostgreSQL only. MySQL/MariaDB drivers, connection strings, and Prisma providers are intentionally not part of this project.

One Express application runs all domain modules:

- auth
- profile
- request
- offer
- chat
- deal
- admin
- notification
- catalog
- currency

Current diploma scope is Option B: buyer requests, seller offers, accepted-offer chat, demo payment after an agreed price, request-deal orders, tracking status, and admin management. Real payment processing, escrow, shipping labels, and carrier integrations are outside the current implementation.

The former service source now lives in `src/modules/*` and is wired through a single `src/app.ts` entry point. Cross-module calls happen in-process instead of through service-to-service HTTP clients.

## Structure

```text
backend/
  src/
    app.ts
    index.ts
    config/
    middleware/
    modules/
      auth/
      profile/
      request/
      offer/
      chat/
      deal/
      admin/
      notification/
      catalog/
      currency/
  prisma/
    schema.prisma
    seed.ts
  docker-compose.yml
  package.json
```

## Local Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Smoke Tests

Smoke tests exercise the main API flow against a local PostgreSQL database: health, signup/login, categories, request creation, offer creation, and accepting an offer into chat.

Set `DATABASE_URL` to a local database before running:

```bash
DATABASE_URL="postgresql://postgres:<password>@localhost:54320/mollmart?schema=public" npm run test:smoke
```

The test suite refuses non-local database URLs.

API base URL:

```text
http://localhost:4040/api/v1
```

Health check:

```text
http://localhost:4040/health
```

## Docker

Backend-only from `backend/`:

```bash
docker compose up --build
```

Docker now starts:

- one backend app on `localhost:4040`
- one PostgreSQL database on `localhost:54320`
- one Redis instance on `localhost:6380`

Full-stack deployment is available from the repository root:

```bash
cp .env.deploy.example .env
docker compose up --build
```
