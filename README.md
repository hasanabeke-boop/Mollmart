# Mollmart

Mollmart is a web-based request-and-offer platform where buyers publish product requests, sellers respond with offers, and accepted offers continue into chat-based negotiation.

The current diploma scope is **Option B**: request creation, seller offers, buyer-seller chat, demo payment after an agreed price, request-deal orders, tracking status, and admin management. Payments and withdrawals are simulated for demonstration only; Mollmart does not provide real card charging, escrow, shipping labels, or carrier integrations. A request/offer/chat-only version can be kept as a later simplified scope.

The project uses a web frontend and a modular monolith backend. Backend domains are separated as internal modules, not independent deployable apps.

## Core Flow

1. Buyers register, create request drafts, and publish requests for products they need.
2. Sellers browse published requests and submit offers.
3. Buyers compare offers and accept the best one.
4. After acceptance, buyers and sellers continue negotiation in chat.
5. When both sides agree on a final price, the buyer can complete a demo payment.
6. A request-deal order is created for tracking, and admins can update order status, carrier, and tracking number.
7. Admins manage categories, moderation cases, user blocking, and request-deal orders.

## Architecture

- **Frontend:** Next.js, React, TypeScript.
- **Backend:** Node.js, Express, TypeScript modular monolith.
- **Database:** one PostgreSQL database managed with Prisma. MySQL/MariaDB are not used or supported by this project.
- **Realtime/events:** Redis pub/sub used internally by the backend.
- **Containerization:** Docker Compose for local development/demo.

## Backend Modules

The backend runs as one application from `backend/src/index.ts`.

- `auth`: registration, login, refresh tokens, password reset, email verification.
- `profile`: buyer and seller profile management.
- `request`: buyer requests and request discovery board.
- `offer`: seller offers and offer acceptance.
- `chat`: buyer-seller conversations and messages.
- `deal`: price proposals, demo payment, request-deal orders, and wallet demo balance.
- `admin`: categories, moderation, user blocking, dashboard summary.
- `notification`: notification API and Redis event worker.
- `catalog`: seller showcase listings used as inspiration for buyer requests.
- `currency`: supported currency metadata and exchange-rate helpers.

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
npm run prisma:seed
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

For the whole stack from the repository root:

```bash
cp .env.deploy.example .env
docker compose up --build
```

This starts the frontend, backend, one PostgreSQL container, and one Redis container.

Local URLs:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:4040
Health:   http://localhost:4040/health
```

The backend container runs Prisma migrations and category seed on startup.
