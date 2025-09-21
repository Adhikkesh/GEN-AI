FROM node:18-slim AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY prototype/package.json prototype/pnpm-lock.yaml prototype/pnpm-workspace.yaml prototype/turbo.json ./prototype/

COPY prototype/packages ./prototype/packages
COPY prototype/apps ./prototype/apps

WORKDIR /app/prototype

RUN pnpm install

RUN pnpm turbo build --filter=api

RUN pnpm deploy --filter=api --prod ../deploy


FROM node:18-slim

WORKDIR /app

COPY --from=builder /app/deploy .

EXPOSE 8080

CMD ["node", "dist/index.js"]