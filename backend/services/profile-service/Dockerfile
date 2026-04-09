FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate && npm run build

EXPOSE 4080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
