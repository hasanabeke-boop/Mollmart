# Mollmart

Mollmart is a web-based request-and-offer platform where buyers publish product requests and sellers respond with offers.

It is not an in-app commerce or fulfillment system. Mollmart does not handle checkout, payments, delivery, shipment tracking, or cart flows. Its core purpose is lead generation, matching, negotiation, and communication between buyers and sellers.

The project uses a web frontend and a modular monolith backend. Backend domains are separated as internal modules, not independent deployable apps.

## Core Flow

1. Buyers register, create request drafts, and publish requests for products they need.
2. Sellers browse published requests and submit offers.
3. Buyers compare offers and accept the best one.
4. After acceptance, buyers and sellers continue negotiation in chat.
5. Admins manage categories, moderation cases, and user blocking.

## Architecture

- **Frontend:** Next.js, React, TypeScript.
- **Backend:** Node.js, Express, TypeScript modular monolith.
- **Database:** one PostgreSQL database managed with Prisma.
- **Realtime/events:** Redis pub/sub used internally by the backend.
- **Containerization:** Docker Compose for local development/demo.

## Backend Modules

The backend runs as one application from `backend/src/index.ts`.

- `auth`: registration, login, refresh tokens, password reset, email verification.
- `profile`: buyer and seller profile management.
- `request`: buyer requests and request discovery board.
- `offer`: seller offers and offer acceptance.
- `chat`: buyer-seller conversations and messages.
- `admin`: categories, moderation, user blocking, dashboard summary.
- `notification`: notification API and Redis event worker.

## Project Structure

```text
Mollmart/
  frontend/
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
    .env.example
```

## Run Backend

From `backend/`:

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API base URL is:

```text
http://localhost:4040/api/v1
```

Health check:

```text
http://localhost:4040/health
```

## Run With Docker

From `backend/`:

```bash
docker compose up --build
```

This starts one backend container, one PostgreSQL container, and one Redis container.
