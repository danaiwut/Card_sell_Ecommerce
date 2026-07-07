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
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("[worker] REDIS_URL is required to run background jobs.");
  process.exit(1);
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const workers: Worker[] = [];
const queues: Queue[] = [];

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
      return releaseEscrow(orderId);
    },
    { connection },
  ),
);

// --- Notifications: persist notification rows ---
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

void scheduleRepeatableJobs().then(() => {
  console.log("[worker] CardVerse workers running:", workers.map((w) => w.name).join(", "));
});

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
