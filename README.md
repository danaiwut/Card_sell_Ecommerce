# CardVerse

Full-stack collectible-card e-commerce marketplace.

- **Shop**: first-party card boxes/singles across 20 collection categories.
- **Marketplace**: user-to-user listings with escrow (Stripe Connect), a market-price chart driven by *actual* completed sales, and a live "recent sales" feed.
- **Shipping**: sellers update carrier + tracking number; escrow auto-releases after delivery.
- **Roles**: `customer`, `manager`, `admin`.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, shadcn-style UI, next-intl (TH/EN), TanStack Query, Recharts |
| Backend | NestJS (Node.js), REST + Socket.IO |
| Database | PostgreSQL + Prisma |
| Cache / Queue | Redis + BullMQ |
| Auth | Clerk |
| Payments | Stripe + Stripe Connect |
| Storage | Cloudflare R2 |

## Monorepo layout

```
apps/
  web      Next.js storefront + marketplace + dashboards
  api      NestJS REST API + realtime gateway
  worker   BullMQ workers (price aggregation, escrow release, notifications)
packages/
  db       Prisma schema + client + seed
  shared   shared types, zod schemas, 20-category taxonomy
  ui       shared React components
```

## Getting started

```bash
pnpm install
cp .env.example .env            # defaults work with the docker-compose below
docker compose up -d            # local Postgres (5432) + Redis (6379)
pnpm db:generate
pnpm db:push                    # create schema (or pnpm db:migrate)
pnpm db:seed                    # taxonomy (20 categories) + demo catalog/products/trades
pnpm dev                        # web on :3000 (proxies API/WS), api on :4000, worker
```

Then open http://localhost:3000 — the browser talks to port 3000 only; Next.js
proxies REST calls to `/backend/*` and Socket.IO to the NestJS API on :4000.

**`pnpm dev` must stay running** in a terminal. If the browser shows
`ERR_CONNECTION_REFUSED`, the dev server is not started yet — this is not
caused by missing Clerk/Stripe keys.

On `/account` you can sign in as `customer`, `manager`, or `admin` (demo mode).
With no Stripe/Clerk keys the app runs in mock mode: payments are auto-captured
and Connect onboarding is simulated, so the full marketplace + escrow + shipping
flow is exercisable locally.

### Modes

- **Demo mode (no keys)** — payments mocked, sellers auto-onboarded, dev session login.
- **Production mode** — set `CLERK_*` and `STRIPE_*` keys; auth uses Clerk, payments use
  Stripe Checkout (shop) and PaymentIntents + Connect transfers (marketplace escrow).

### Image uploads

Manager/admin product forms support direct image upload through
`POST /storage/presign`, which returns a Cloudflare R2 presigned `PUT` URL and
the final public image URL. Configure `R2_*` env vars to enable it. In local
demo mode you can still paste an external `imageUrl` manually.

## Deployment

| Component | Recommended host |
| --- | --- |
| `apps/web` | Vercel (Next.js) |
| `apps/api` | Railway / Render / Fly (container, `apps/api/Dockerfile`) |
| `apps/worker` | same container host (`apps/worker/Dockerfile`) |
| PostgreSQL | Supabase or Neon |
| Redis | Upstash |
| Images | Cloudflare R2 |

CI builds + typechecks every push (`.github/workflows/ci.yml`). Point each
service at the shared `DATABASE_URL` / `REDIS_URL`, set `INTERNAL_API_SECRET`
to the same value on api + worker, and configure the Stripe webhook to
`POST {API_URL}/payments/webhook`.
