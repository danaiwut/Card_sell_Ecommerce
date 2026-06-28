import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@cardverse/db";
import { QUEUE_NAMES } from "@cardverse/shared";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("[worker] REDIS_URL is required to run background jobs.");
  process.exit(1);
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const apiUrl = process.env.API_URL ?? "http://localhost:4000";
const internalSecret = process.env.INTERNAL_API_SECRET ?? "dev-internal-secret";
const DAY_MS = 24 * 60 * 60 * 1000;

async function callInternal(path: string) {
  const res = await fetch(`${apiUrl}/internal${path}`, {
    method: "POST",
    headers: { "x-internal-secret": internalSecret },
  });
  if (!res.ok) {
    throw new Error(`internal call ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// --- Price aggregation: roll Trade rows into daily PricePoint buckets ---
async function aggregatePrices(catalogItemId: string) {
  const since = new Date(Date.now() - 365 * DAY_MS);
  const trades = await prisma.trade.findMany({
    where: { catalogItemId, soldAt: { gte: since } },
    select: { price: true, soldAt: true },
  });

  const buckets = new Map<string, number[]>();
  for (const t of trades) {
    const day = new Date(t.soldAt);
    day.setUTCHours(0, 0, 0, 0);
    const key = day.toISOString();
    const arr = buckets.get(key) ?? [];
    arr.push(t.price);
    buckets.set(key, arr);
  }

  for (const [iso, prices] of buckets) {
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    await prisma.pricePoint.upsert({
      where: { catalogItemId_day: { catalogItemId, day: new Date(iso) } },
      update: { avg, low: Math.min(...prices), high: Math.max(...prices), volume: prices.length },
      create: {
        catalogItemId,
        day: new Date(iso),
        avg,
        low: Math.min(...prices),
        high: Math.max(...prices),
        volume: prices.length,
      },
    });
  }
  return { catalogItemId, buckets: buckets.size };
}

const workers: Worker[] = [];

workers.push(
  new Worker(
    QUEUE_NAMES.PRICE_AGGREGATION,
    async (job: Job) => aggregatePrices(job.data.catalogItemId),
    { connection },
  ),
);

// --- Escrow auto-release: release funds to seller if buyer didn't confirm ---
workers.push(
  new Worker(
    QUEUE_NAMES.ESCROW_RELEASE,
    async (job: Job) => {
      const { orderId } = job.data as { orderId: string };
      const order = await prisma.marketplaceOrder.findUnique({ where: { id: orderId } });
      if (!order) return { skipped: "missing" };
      // Only auto-release if still in a shippable/holding state and past due.
      if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
        return { skipped: order.status };
      }
      if (order.releaseDueAt && order.releaseDueAt.getTime() > Date.now()) {
        return { skipped: "not-due" };
      }
      return callInternal(`/orders/${orderId}/release-escrow`);
    },
    { connection },
  ),
);

// --- Notifications: persist notification rows ---
workers.push(
  new Worker(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job: Job) => {
      const { userId, type, title, body, link } = job.data;
      await prisma.notification.create({
        data: { userId, type, title, body, link },
      });
      return { ok: true };
    },
    { connection },
  ),
);

for (const w of workers) {
  w.on("completed", (job) => console.log(`[worker] ${w.name} #${job.id} done`));
  w.on("failed", (job, err) => console.error(`[worker] ${w.name} #${job?.id} failed:`, err.message));
}

console.log("[worker] CardVerse workers running:", workers.map((w) => w.name).join(", "));

async function shutdown() {
  console.log("[worker] shutting down...");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
