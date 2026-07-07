import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis, { type Redis } from "ioredis";
import { QUEUE_NAMES } from "@cardverse/shared";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection: Redis | null;
  private readonly queues = new Map<string, Queue>();

  constructor() {
    const url = process.env.REDIS_URL;
    this.connection = url
      ? new IORedis(url, { maxRetriesPerRequest: null })
      : null;
    if (!this.connection) {
      this.logger.warn("REDIS_URL not set — background jobs are disabled.");
    }
  }

  private queue(name: string): Queue | null {
    const connection = this.connection;
    if (!connection) return null;
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection }));
    }
    return this.queues.get(name)!;
  }

  async enqueuePriceAggregation(catalogItemId: string) {
    await this.queue(QUEUE_NAMES.PRICE_AGGREGATION)?.add(
      "aggregate",
      { catalogItemId },
      { removeOnComplete: 100, removeOnFail: 100 },
    );
  }

  async enqueueEscrowRelease(orderId: string, delayMs: number) {
    await this.queue(QUEUE_NAMES.ESCROW_RELEASE)?.add(
      "release",
      { orderId },
      { delay: delayMs, jobId: `release-${orderId}`, removeOnComplete: true },
    );
  }

  async enqueueNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    link?: string;
  }) {
    await this.queue(QUEUE_NAMES.NOTIFICATIONS)?.add("notify", payload, {
      removeOnComplete: 200,
    });
  }

  async enqueueShipmentTracking(payload: {
    courier: "FLASH";
    source: "webhook";
    payload: unknown;
  }) {
    await this.queue(QUEUE_NAMES.SHIPMENT_POLL)?.add(
      "flash-webhook",
      payload,
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    );
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    await this.connection?.quit();
  }
}
