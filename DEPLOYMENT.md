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
- persistent `/app/uploads` disk for local uploaded images

Also provide these optional/supporting production variables as needed:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=no-reply@your-domain.com
OPENAI_API_KEY=your-openai-key
```

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
