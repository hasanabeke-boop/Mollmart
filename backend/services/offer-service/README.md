# Offer Service

Production-like TypeScript microservice for Mollmart seller offers.

This service owns the offer lifecycle:

- sellers submit offers against open buyer requests
- sellers update or withdraw editable offers
- buyers view offers for their own requests
- sellers view offers they submitted
- buyers accept one offer
- competing active offers are rejected after acceptance
- offer status history is recorded
- Redis events are published for important state changes

## Service Boundaries

This service is responsible for offer data, offer lifecycle rules, and acceptance coordination.

- It does own offer persistence, status transitions, seller-side authoring rules, and request-level single acceptance behavior.
- It does not own request content, request lifecycle, user identity, chat, or negotiation threads.
- It validates request existence, openness, and buyer ownership through synchronous REST calls to `request-service`.

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
backend/services/offer-service
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
PORT=4060
SERVER_URL=http://localhost:4060
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5436/offerdb?schema=public
JWT_ACCESS_SECRET=change-me-offer-service
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
REQUEST_SERVICE_URL=http://localhost:4050/api/v1
REQUEST_SERVICE_TIMEOUT_MS=5000
ALLOW_MULTIPLE_ACTIVE_OFFERS_PER_REQUEST=false
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
http://localhost:4060/api/v1
```

Endpoints:

- `POST /offers`
- `PATCH /offers/:id`
- `POST /offers/:id/withdraw`
- `GET /offers/me`
- `GET /offers/request/:requestId`
- `POST /offers/:id/accept`

## Core Offer Rules

- Only sellers can create offers.
- A seller cannot submit more than one active offer to the same request unless config allows it.
- Offers can only target requests that are visible and open in `request-service`.
- Request owners cannot submit offers to their own requests.
- Accepted offers become read-only.
- When one offer is accepted, other active offers for that request are rejected.
- Acceptance is idempotent for the same offer.

## Redis Events

The service publishes JSON payloads to Redis pub/sub channels:

- `offer.created`
- `offer.updated`
- `offer.withdrawn`
- `offer.accepted`
- `offer.rejected`

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

From `backend/services/offer-service`:

```bash
docker compose up --build
```

This starts:

- `offer-service` on port `4060`
- PostgreSQL on port `5436`
- Redis on port `6379`

## Request-Service Integration

The service uses `request-service` as a synchronous dependency for:

- validating that a request exists
- confirming it is visible and still open
- verifying buyer ownership during offer acceptance

Integration happens through `GET /requests/:id` on `request-service`, forwarding the acting user context as headers.

## Example Requests

Create an offer:

```http
POST /api/v1/offers
Authorization: Bearer <seller-token>
Content-Type: application/json
```

```json
{
  "requestId": "req_123",
  "price": 3200,
  "currency": "USD",
  "message": "We can deliver in two batches and include assembly.",
  "deliveryDays": 14,
  "warrantyInfo": "12 months replacement warranty"
}
```

Accept an offer:

```http
POST /api/v1/offers/:id/accept
Authorization: Bearer <buyer-token>
```

## Tests

The included tests cover core offer lifecycle behavior:

- seller-only creation
- duplicate active offer prevention
- buyer acceptance with rejection of competing offers
- idempotent repeat acceptance
- seller cannot accept an offer

## Assumptions

- Request closure in `request-service` is not directly mutated here because the current `request-service` public API does not yet expose a dedicated internal acceptance endpoint.
- To keep the system safe now, `offer-service` prevents additional offers once it has a locally accepted offer for a request, even if `request-service` has not yet been advanced to `accepted`.
- Rejected competing offers serve as the practical archive behavior for the current MVP.
