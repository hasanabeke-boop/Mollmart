#!/bin/sh
set -eu

attempt=1
max_attempts=30

until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Prisma migrate deploy failed after $max_attempts attempts"
    exit 1
  fi

  echo "Database is not ready yet; retrying Prisma migrate deploy ($attempt/$max_attempts)..."
  attempt=$((attempt + 1))
  sleep 2
done

npm run prisma:seed:prod
exec node dist/index.js
