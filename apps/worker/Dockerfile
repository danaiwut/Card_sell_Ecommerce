# CardVerse worker (BullMQ). Build from the repo root:
#   docker build -f apps/worker/Dockerfile -t cardverse-worker .
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cardverse/shared build \
  && pnpm --filter @cardverse/db generate \
  && pnpm --filter @cardverse/db build \
  && pnpm --filter @cardverse/worker build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
