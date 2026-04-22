FROM node:18-alpine3.16 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN apk add --no-cache --virtual .build-deps \
    make \
    gcc \
    g++ \
    python3 \
    && npm ci \
    && npm cache clean --force

COPY . .

RUN npm run build \
    && npx prisma generate \
    && npm prune --omit=dev \
    && apk del .build-deps

FROM node:18-alpine3.16 AS run

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

COPY --chown=nodejs:nodejs --from=build /app/dist ./dist
COPY --chown=nodejs:nodejs --from=build /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nodejs:nodejs --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production
ENV PORT=4040

EXPOSE 4040

CMD ["sh", "-c", "npx prisma migrate deploy && dumb-init node dist/index.js"]
