import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@cardverse/db";
import { QUEUE_NAMES } from "@cardverse/shared";
import { loadRootEnv } from "./env";
import { aggregatePrices } from "./processors/price-aggregation.processor";
import { releaseEscrow } from "./processors/escrow-release.processor";
import { persistNotification } from "./processors/notification.processor";
import { processShipmentTracking } from "./processors/shipment-tracking.processor";

loadRootEnv();

async function connectRedis(url: string): Promise<IORedis | null> {
  const connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 4_000,
    retryStrategy: () => null,
  });

  try {
    await connection.connect();
    await connection.ping();
    return connection;
  } catch {
    try {
      connection.disconnect();
    } catch {
      /* ignore */
    }
    return null;
  }
}

async function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[worker] REDIS_URL is not set — background jobs are disabled.");
    console.warn("[worker] Set REDIS_URL in .env and start Redis to enable the worker.");
    await prisma.$disconnect();
    return;
  }

  const redis = await connectRedis(redisUrl);
  if (!redis) {
    console.warn(`[worker] Redis unavailable at ${redisUrl}`);
    console.warn("[worker] Background jobs are disabled for this session.");
    console.warn("[worker] Start Redis: docker compose up -d redis");
    console.warn("[worker] Then run: pnpm dev:all");
    await prisma.$disconnect();
    return;
  }
  const connection = redis;

  const workers: Worker[] = [];
  const queues: Queue[] = [];

  workers.push(
    new Worker(
      QUEUE_NAMES.PRICE_AGGREGATION,
      async (job: Job) => aggregatePrices(job.data.catalogItemId),
      { connection },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.ESCROW_RELEASE,
      async (job: Job) => {
        const { orderId } = job.data as { orderId: string };
        return releaseEscrow(orderId);
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.NOTIFICATIONS,
      async (job: Job) => persistNotification(job.data),
      { connection },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.SHIPMENT_POLL,
      processShipmentTracking,
      { connection },
    ),
  );

  async function scheduleRepeatableJobs() {
    const shipmentQueue = new Queue(QUEUE_NAMES.SHIPMENT_POLL, { connection });
    queues.push(shipmentQueue);
    await shipmentQueue.add(
      "flash-reconcile",
      { courier: "FLASH", source: "reconcile" },
      {
        jobId: "flash-reconcile",
        repeat: { every: 15 * 60 * 1000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );
  }

  for (const w of workers) {
    w.on("completed", (job) => console.log(`[worker] ${w.name} #${job.id} done`));
    w.on("failed", async (job, err) => {
      console.error(`[worker] ${w.name} #${job?.id} failed:`, err.message);
      if (w.name === QUEUE_NAMES.SHIPMENT_POLL) {
        await notifyAdmins(`Shipment tracking job failed: ${err.message}`);
      }
    });
  }

  await scheduleRepeatableJobs();
  console.log("[worker] CardVerse workers running:", workers.map((w) => w.name).join(", "));

  async function shutdown() {
    console.log("[worker] shutting down...");
    await Promise.all(workers.map((w) => w.close()));
    await Promise.all(queues.map((q) => q.close()));
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function notifyAdmins(body: string) {
  const users = await prisma.user.findMany({
    where: { role: { in: ["manager", "admin"] } },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: "SYSTEM",
      title: "Shipment tracking needs attention",
      body,
      link: "/admin",
    })),
  });
}

main().catch(async (err) => {
  console.error("[worker] fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
