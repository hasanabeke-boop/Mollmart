FROM node:18-alpine3.16 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN apk add --no-cache --virtual .build-deps \
    gcc \
    g++ \
    python3 \
    && npm ci \
    && apk del .build-deps \
    && npm cache clean --force

COPY . .

RUN npm run build

FROM node:18-alpine3.16 AS run

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

RUN npm ci --omit=dev \
    && npm cache clean --force \
    && npx prisma generate

COPY --chown=nodejs:nodejs --from=build /app/dist ./dist

RUN chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production
ENV PORT=4040

EXPOSE 4040

CMD ["dumb-init", "node", "dist/index.js"]
