# Backend

The backend is now a modular monolith.

One Express application runs all domain modules:

- auth
- profile
- request
- offer
- chat
- admin
- notification

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
      admin/
      notification/
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
npm run prisma:push
npm run dev
```

API base URL:

```text
http://localhost:4040/api/v1
```

Health check:

```text
http://localhost:4040/health
```

## Docker

From `backend/`:

```bash
docker compose up --build
```

Docker now starts:

- one backend app on `localhost:4040`
- one PostgreSQL database on `localhost:54320`
- one Redis instance on `localhost:6380`
