FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY src ./src
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --include=dev
COPY tsconfig*.json ./
COPY src ./src
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
# Strip CRLF (Windows checkouts) so shebang works; avoid node image ENTRYPOINT wrapping CMD as a node arg
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh
EXPOSE 4040
ENTRYPOINT []
CMD ["sh", "./docker-entrypoint.sh"]
