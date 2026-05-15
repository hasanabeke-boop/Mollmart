# Mollmart Deployment

## Frontend: Vercel

Create a Vercel project from this repository and set the project root directory to `frontend`.

Set this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://mollmart-backend.onrender.com
```

Do not add `/api/v1` to `NEXT_PUBLIC_API_URL`; the frontend already includes `/api/v1` in API calls.

## Backend: Render

Use the root `render.yaml` Blueprint to create:

- `mollmart-backend` Docker web service
- `mollmart-postgres` PostgreSQL database
- `mollmart-redis` Redis-compatible Key Value service
- persistent `/app/uploads` disk for local uploaded images

During the Render Blueprint setup, provide:

```env
CORS_ORIGIN=https://mollmart-owcb.vercel.app,https://mollmart.vercel.app
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
CORS_ORIGIN=https://your-vercel-project-url
```

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, and `REDIS_URL` are handled by the Render Blueprint.
