# Chat Service

Production-like TypeScript microservice for Mollmart marketplace chat.

This service owns contextual private messaging between the buyer and seller around a marketplace request and, optionally, a specific offer.

Core capabilities:

- create or reopen request-linked conversations
- send messages between participants
- list conversations for the current user
- fetch message history
- mark unread messages as read
- publish Redis-backed notification events
- enforce participant-only access

## Service Boundaries

This service is responsible for conversation and message data only.

- It does own conversation uniqueness, message persistence, read tracking, and participant access control.
- It does not own request content, offer decisioning, or generic user messaging outside marketplace context.
- It validates request context through `request-service`.
- If `offerId` is supplied, it stores the linkage and validates the offer through `offer-service` when possible.

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
backend/services/chat-service
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
PORT=4070
SERVER_URL=http://localhost:4070
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5437/chatdb?schema=public
JWT_ACCESS_SECRET=change-me-chat-service
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
REQUEST_SERVICE_URL=http://localhost:4050/api/v1
REQUEST_SERVICE_TIMEOUT_MS=5000
OFFER_SERVICE_URL=http://localhost:4060/api/v1
OFFER_SERVICE_TIMEOUT_MS=5000
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
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
http://localhost:4070/api/v1
```

Endpoints:

- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:id`
- `GET /conversations/:id/messages`
- `POST /conversations/:id/messages`
- `POST /conversations/:id/read`

## Core Rules

- Only the buyer and seller participants can access a conversation.
- Conversations are tied to marketplace entities and cannot be created as free-form global chats.
- Messages are immutable in the MVP.
- Read tracking is stored per user per message.
- Redis events are published for conversation creation, message creation, and reads.

## Redis Events

The service publishes JSON payloads to Redis pub/sub channels:

- `chat.conversation.created`
- `chat.message.created`
- `chat.message.read`

## Realtime Approach

This MVP uses Redis pub/sub plus REST polling instead of Socket.IO.

That keeps the service simple and independently runnable while still giving the frontend or gateway a clean event stream for notification fan-out.

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

From `backend/services/chat-service`:

```bash
docker compose up --build
```

This starts:

- `chat-service` on port `4070`
- PostgreSQL on port `5437`
- Redis on port `6379`

## Conversation Uniqueness

The MVP uses one conversation per `requestId + buyerId + sellerId`.

- Repeated `POST /conversations` for the same trio returns the existing conversation.
- `offerId` is treated as optional context metadata on that shared thread.
- If a conversation already exists without `offerId` and a later open call includes one, the service keeps the existing thread and fills in `offerId` only if it is currently empty.

This keeps the chat simple and avoids fragmented parallel threads for the same buyer-seller negotiation around one request.

## Tests

The included tests cover:

- participant-only conversation access
- successful message sending
- read marking for recipient-only unread messages

## Assumptions

- `request-service` is the primary source of truth for request participant context.
- `offer-service` currently does not expose a rich public lookup API, so optional `offerId` validation is implemented via a lightweight client assumption for future compatibility and degrades to request-context-only validation if no offer-specific verification is available.
