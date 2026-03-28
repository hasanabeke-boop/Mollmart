# Profile Service

Production-like TypeScript microservice for Mollmart marketplace identity and public profile data.

This service owns business and public-facing profile information, separate from authentication credentials.

Core capabilities:

- store user profile basics for buyers and sellers
- manage role-aware buyer and seller profile details
- expose public seller listing and seller detail data
- let users view and update their own profile
- keep verification and reputation placeholders ready for later review features

## Service Boundaries

This service is responsible for profile and public identity data only.

- It does own marketplace profile fields, seller visibility, verification placeholders, and reputation placeholders.
- It does not own passwords, refresh tokens, email verification, or login flows.
- It is designed to integrate cleanly with `request-service`, `offer-service`, and future review features through stable `userId`-based lookups.

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
backend/services/profile-service
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
PORT=4080
SERVER_URL=http://localhost:4080
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5438/profiledb?schema=public
JWT_ACCESS_SECRET=change-me-profile-service
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

## API Summary

Base URL:

```text
http://localhost:4080/api/v1
```

Endpoints:

- `GET /profiles/me`
- `PATCH /profiles/me`
- `GET /profiles/sellers/:userId`
- `GET /profiles/buyers/:userId`
- `GET /profiles/sellers`
- `PATCH /profiles/me/seller`
- `PATCH /profiles/me/buyer`

## Public and Private Data

Private self-profile responses can include:

- phone
- avatarUrl
- profile role metadata
- buyer preferences

Public seller endpoints expose only marketplace-safe fields such as:

- `userId`
- `displayName`
- `description`
- `businessType`
- `website`
- `instagramUrl`
- `verificationStatus`
- `ratingAverage`
- `completedDealsCount`
- selected base profile context like city and avatar

Public seller endpoints never expose phone or buyer preferences.

## Redis Events

This MVP publishes profile lifecycle notifications for downstream cache invalidation and sync:

- `profile.updated`
- `profile.seller.updated`
- `profile.buyer.updated`

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

From `backend/services/profile-service`:

```bash
docker compose up --build
```

This starts:

- `profile-service` on port `4080`
- PostgreSQL on port `5438`
- Redis on port `6379`

## Integration Notes

This service is designed to be easy to join from other services by `userId`.

- `request-service` can display buyer or seller profile snippets by `userId`
- `offer-service` can enrich seller submissions with public seller identity
- `chat-service` can show conversation counterpart display data from this service

## Tests

The included tests cover:

- users can view their own profile
- public seller response shaping
- role-restricted buyer and seller detail updates
