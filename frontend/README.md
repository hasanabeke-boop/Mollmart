# Mollmart Frontend

Next.js frontend for the Mollmart diploma app.

Current scope is Option B:

- buyer request creation and management
- seller request discovery and offers
- accepted-offer chat
- price agreement and demo payment
- request-deal orders and tracking
- admin categories, moderation, users, and orders

Demo payment is not real payment processing. The app simulates payment confirmation, wallet balance, and tracking for the diploma flow.

## Local Setup

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4040
```

Then run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Checks

```bash
npm run build
npm run lint
```
