# Backend

This backend can now run in two ways:

- all services together from `backend/docker-compose.yml`
- each service separately from its own `backend/services/<service>/docker-compose.yml`

## Run Whole Backend

From `backend/`:

```bash
docker compose up --build
```

Services:

- auth-service: `http://localhost:4040`
- request-service: `http://localhost:4050`
- offer-service: `http://localhost:4060`
- chat-service: `http://localhost:4070`
- profile-service: `http://localhost:4080`
- admin-service: `http://localhost:4090`
- notification-service: `http://localhost:4100`

Databases:

- auth: `localhost:5432`
- request: `localhost:5435`
- offer: `localhost:5436`
- chat: `localhost:5437`
- profile: `localhost:5438`
- admin: `localhost:5439`
- notification: `localhost:5440`

Redis:

- `localhost:6379`

Optional shared env file:

```bash
cp .env.example .env
```

You can set:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

## Run One Service Separately

Example:

```bash
cd services/auth-service
docker compose up --build
```

The per-service compose files still work independently.
