# Notification Service

Production-like TypeScript microservice for Mollmart in-app notifications.

Core capabilities:

- subscribe to Redis domain events
- transform supported events into user notifications
- persist in-app notifications
- expose APIs for listing notifications and marking them read
- remain decoupled from domain services beyond event consumption

## Service Boundaries

This service is responsible for notification creation and retrieval only.

- It does own event subscription, notification persistence, read state, and user-facing notification APIs.
- It does not own request, offer, chat, moderation, or user profile business logic.
- It consumes domain events published by other services and maps them into deterministic notification records.

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
backend/services/notification-service
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
PORT=4100
SERVER_URL=http://localhost:4100
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5440/notificationdb?schema=public
JWT_ACCESS_SECRET=change-me-notification-service
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
SUBSCRIBE_MODERATION_EVENTS=true
```

## Auth Assumption

For production-like flows, send `Authorization: Bearer <jwt>`. The JWT should contain:

- `sub` or `userId`
- `role`

For local development and tests, the service also accepts:

- `x-user-id`
- `x-user-role`

## API Summary

Base URL:

```text
http://localhost:4100/api/v1
```

Endpoints:

- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`

## Supported Redis Events

This version listens for:

- `request.published`
- `offer.created`
- `offer.accepted`
- `chat.message.created`
- `user.blocked`
- `moderation.case.created` when `SUBSCRIBE_MODERATION_EVENTS=true`

## Event Mapping Assumptions

The worker expects these payload shapes:

- `request.published`: `{ requestId, buyerId }`
- `offer.created`: `{ offerId, requestId, sellerId, buyerId? }`
- `offer.accepted`: `{ offerId, requestId, sellerId, buyerId? }`
- `chat.message.created`: `{ messageId, conversationId, senderId, senderRole, buyerId?, sellerId? }`
- `user.blocked`: `{ userId, reason? }`
- `moderation.case.created`: `{ id, assignedTo?, createdBy? }`

If a payload is malformed or lacks a recipient, the worker skips it and logs a warning instead of failing the process.

## Duplicate Prevention

The service uses a deterministic `dedupeKey` where practical so repeated Redis deliveries do not create repeated notifications for the same user and event reference.

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

From `backend/services/notification-service`:

```bash
docker compose up --build
```

This starts:

- `notification-service` on port `4100`
- PostgreSQL on port `5440`
- Redis on port `6379`

## Tests

The included tests cover:

- notification creation from supported events
- resilience to malformed event payloads
- marking notifications read
