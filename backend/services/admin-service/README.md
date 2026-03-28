# Admin Service

Production-like TypeScript microservice for Mollmart platform moderation and admin control tools.

Core capabilities:

- manage marketplace categories
- create and resolve moderation cases
- store content flags and hidden content decisions
- block and unblock users
- expose a simple admin dashboard summary
- publish moderation and admin events for other services to consume

## Service Boundaries

This service is responsible for lightweight platform control workflows.

- It does own categories, moderation cases, moderation actions, blocked users, and content visibility flags.
- It does not own the original request, offer, or user records themselves.
- Other services are expected to consume moderation events or query block/hide state to enforce visibility in public flows.

## Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Redis
- Winston
- Joi

## Project Structure

```text
backend/services/admin-service
|- prisma
|  |- migrations
|  |- schema.prisma
|  `- seed.ts
|- src
|  |- config
|  |- controllers
|  |- middleware
|  |- repositories
|  |- routes
|  |- services
|  |- types
|  |- utils
|  |- validators
|  |- app.ts
|  `- index.ts
|- __test__
|- Dockerfile
|- docker-compose.yml
|- package.json
`- README.md
```

## Environment Variables

Copy `.env.example` to `.env`.

```env
NODE_ENV=development
PORT=4090
SERVER_URL=http://localhost:4090
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5439/admindb?schema=public
JWT_ACCESS_SECRET=change-me-admin-service
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

## Auth Assumption

For production-like flows, send `Authorization: Bearer <jwt>`. The JWT should contain:

- `sub` or `userId`
- `role`

For local development and tests, the service also accepts:

- `x-user-id`
- `x-user-role`

All endpoints in this service require admin role.

## API Summary

Base URL:

```text
http://localhost:4090/api/v1
```

Endpoints:

- `POST /admin/categories`
- `GET /admin/categories`
- `PATCH /admin/categories/:id`
- `POST /admin/moderation/cases`
- `GET /admin/moderation/cases`
- `PATCH /admin/moderation/cases/:id`
- `POST /admin/users/:userId/block`
- `POST /admin/users/:userId/unblock`
- `GET /admin/dashboard/summary`

## Moderation Targets

The MVP supports moderation targets for:

- `request`
- `offer`
- `user`

Content hiding is represented through `ContentFlag` records and moderation actions.

This keeps the rule set simple while still giving public-facing services something clear to consume.

## Redis Events

The service publishes JSON payloads to Redis pub/sub channels:

- `admin.category.updated`
- `moderation.case.created`
- `moderation.case.resolved`
- `user.blocked`
- `user.unblocked`

## Dashboard Summary

The dashboard endpoint returns lightweight counts for:

- blocked users
- active categories
- total flags
- open moderation cases
- flagged requests
- flagged offers
- flagged users

Because this service does not own request, offer, or user records, the `users`, `requests`, and `offers` summary values are modeled as moderation/control counts rather than full platform-wide canonical totals.

## Local Development

```bash
npm install
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
npm run build
npm run test
npm run dev
```

## Docker

From `backend/services/admin-service`:

```bash
docker compose up --build
```

This starts:

- `admin-service` on port `4090`
- PostgreSQL on port `5439`
- Redis on port `6379`

## Tests

The included tests cover:

- admin-only category management behavior
- moderation case resolution rules
- blocking and unblocking users
