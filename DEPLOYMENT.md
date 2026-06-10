# Mollmart Deployment

## Frontend: Vercel

Create a Vercel project from this repository and set the project root directory to `frontend`.

Set this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://mollmart.onrender.com
```

This frontend is Next.js, not Vite, so use `NEXT_PUBLIC_API_URL`. `VITE_API_URL` is also read as a compatibility fallback during Next build, but `NEXT_PUBLIC_API_URL` is the correct Vercel variable for this app. Do not add `/api/v1`; the frontend already includes `/api/v1` in API calls.

## Backend: Render

Set the Render backend root directory to `backend`. The backend is an Express app and listens on `process.env.PORT`.

Set these environment variables in Render:

```env
NODE_ENV=production
DATABASE_URL=<Render PostgreSQL Internal Database URL>
SERVER_URL=https://mollmart.onrender.com
CORS_ORIGINS=https://mollmart-azure.vercel.app
```

The root `render.yaml` Blueprint can create:

- `mollmart` Docker web service
- `mollmart-postgres` PostgreSQL database
- `mollmart-redis` Redis-compatible Key Value service
- Cloudflare R2 configuration for uploaded images

Render Free web services cannot connect to SMTP ports `25`, `465`, or `587`. For Gmail delivery on Render Free, enable the Gmail API in Google Cloud, create OAuth credentials, authorize the sender mailbox with the `https://www.googleapis.com/auth/gmail.send` scope, and provide the resulting refresh token:

```env
GMAIL_API_CLIENT_ID=your-google-oauth-client-id
GMAIL_API_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_API_REFRESH_TOKEN=your-google-oauth-refresh-token
GMAIL_API_USER_ID=me
EMAIL_FROM=your-sender@gmail.com
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
OPENAI_API_KEY=your-openai-key
```

The backend exchanges the refresh token and sends MIME messages with Gmail API HTTPS calls. Gmail API is the only production email transport. Email verification is mandatory for every new account.

If Render or Vercel gives you different public URLs, update these:

```env
SERVER_URL=https://your-render-backend-url
NEXT_PUBLIC_API_URL=https://your-render-backend-url
CORS_ORIGINS=https://your-vercel-project-url
```

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, and `REDIS_URL` are handled by the Render Blueprint.

## API Paths

Backend health:

```text
GET https://mollmart.onrender.com/health
```

Backend live/root:

```text
GET https://mollmart.onrender.com/
```

Auth routes use the `/api/v1` prefix:

```text
POST https://mollmart.onrender.com/api/v1/auth/signup
POST https://mollmart.onrender.com/api/v1/auth/login
```

There is no `/api/auth/register` route in this backend.

## Database monitoring and wipe (Render Shell)

From the Render dashboard, open the **mollmart** web service → **Shell**, then run:

```bash
npm run db:status:prod
```

This prints JSON with database size, per-table row estimates, and key entity totals.

To wipe all application data (truncates public tables, re-seeds default categories; does **not** delete R2 upload files):

```bash
DB_WIPE_CONFIRM=WIPE_MOLLMART_DATA npm run db:wipe:prod
```

The wipe command refuses to run without the exact `DB_WIPE_CONFIRM` phrase.

Admins can also view live database stats in the web UI at `/admin/monitoring` (requires admin login). The API endpoint is:

```text
GET https://mollmart.onrender.com/api/v1/admin/database/stats
```
