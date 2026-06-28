# CardVerse API (NestJS). Build from the repo root:
#   docker build -f apps/api/Dockerfile -t cardverse-api .
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @cardverse/shared build \
  && pnpm --filter @cardverse/db generate \
  && pnpm --filter @cardverse/db build \
  && pnpm --filter @cardverse/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
