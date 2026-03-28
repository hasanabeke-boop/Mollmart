# Request Service

Production-like TypeScript microservice for Mollmart buyer purchase requests.

This service owns the buyer request lifecycle:

- create draft requests
- publish drafts to the seller board
- list a buyer's own requests
- expose open published requests for sellers
- update editable requests
- close or cancel requests
- record request status history
- publish Redis events for important state changes

## Service Boundaries

This service is responsible for request data and lifecycle rules only.

- It does own request content, request status transitions, status history, and seller-board filtering.
- It does not own offer submission, chat, category management, or user identity storage.
- It expects authenticated user context from JWT claims or development headers and stores only `buyerId` plus role-based authorization decisions.

System-managed statuses such as `has_offers`, `in_negotiation`, and `accepted` are modeled now so the service is ready for offer-service integration, but the current public MVP exposes only the request-owner endpoints requested in this task.

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
backend/services/request-service
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
PORT=4050
SERVER_URL=http://localhost:4050
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5435/requestdb?schema=public
JWT_ACCESS_SECRET=change-me-request-service
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
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

That keeps the service independently runnable before the auth service is fully wired through Kong.

## API Summary

Base URL:

```text
http://localhost:4050/api/v1
```

Endpoints:

- `POST /requests`
- `POST /requests/:id/publish`
- `GET /requests/me`
- `GET /requests`
- `GET /requests/:id`
- `PATCH /requests/:id`
- `POST /requests/:id/close`
- `POST /requests/:id/cancel`

## Core Request Rules

- Only buyers can create requests.
- Only the owner or admin can view private draft requests.
- Drafts are freely editable.
- Published requests without offers are editable.
- Published requests with offers can only receive limited updates.
- Accepted, closed, and cancelled requests are locked.
- Seller board lists only requests still open for offers.

## Seller Board Filters

`GET /requests` supports:

- `categoryId`
- `currency`
- `location`
- `q`
- `isNegotiable`
- `budgetMin`
- `budgetMax`
- `deadlineFrom`
- `deadlineTo`
- `page`
- `limit`
- `sortBy`
- `sortOrder`

Allowed `sortBy` values:

- `publishedAt`
- `createdAt`
- `deadlineAt`
- `budgetMin`
- `budgetMax`

## Redis Events

The service publishes JSON payloads to Redis pub/sub channels:

- `request.published`
- `request.updated`
- `request.closed`
- `request.accepted`

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

From `backend/services/request-service`:

```bash
docker compose up --build
```

This starts:

- `request-service` on port `4050`
- PostgreSQL on port `5435`
- Redis on port `6379`

## Example Requests

Create a draft:

```http
POST /api/v1/requests
Authorization: Bearer <buyer-token>
Content-Type: application/json
```

```json
{
  "title": "Need 50 office chairs",
  "description": "Ergonomic black office chairs for a new team space.",
  "categoryId": "office-furniture",
  "budgetMin": 2500,
  "budgetMax": 4000,
  "currency": "USD",
  "location": "Almaty",
  "deadlineAt": "2026-04-10T12:00:00.000Z",
  "isNegotiable": true,
  "attachments": [
    {
      "fileName": "chairs-spec.pdf",
      "fileUrl": "https://files.example.com/chairs-spec.pdf",
      "mimeType": "application/pdf"
    }
  ]
}
```

Publish:

```http
POST /api/v1/requests/:id/publish
Authorization: Bearer <buyer-token>
```

Seller board:

```http
GET /api/v1/requests?categoryId=office-furniture&sortBy=publishedAt&sortOrder=desc&page=1&limit=20
Authorization: Bearer <seller-token>
```

## Tests

The included tests cover core request lifecycle behavior in the domain service:

- buyer-only creation
- publish transition and event emission
- restricted updates after offers exist
- invalid cancellation of accepted requests
