import type { Job } from "bullmq";
import { prisma } from "@cardverse/db";
import { normalizeFlashRoutesResponse, normalizeFlashWebhook } from "../adapters/flash.adapter";
import { fetchFlashTrackingRoute } from "../clients/flash.client";
import { callInternal } from "../internal-api";

const RECONCILE_STALE_MS = 3 * 24 * 60 * 60 * 1000;
const ACTIVE_FLASH_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "LABEL_CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
] as const;

export async function processShipmentTracking(job: Job) {
  if (job.name === "flash-reconcile") {
    return reconcileFlashShipments();
  }

  const data = job.data as { courier?: string; source?: string; payload?: unknown };
  if (data.courier !== "FLASH") {
    return { skipped: "unsupported-courier" };
  }

  const event = normalizeFlashWebhook(data.payload);
  return callInternal("/shipments/carrier-event", event);
}

async function reconcileFlashShipments() {
  const cutoff = new Date(Date.now() - RECONCILE_STALE_MS);
  const shipments = await prisma.shipment.findMany({
    where: {
      carrier: "FLASH",
      trackingNumber: { not: null },
      status: { in: [...ACTIVE_FLASH_STATUSES] },
      updatedAt: { lte: cutoff },
    },
    take: 50,
    orderBy: { updatedAt: "asc" },
  });

  let synced = 0;
  let skipped = 0;
  for (const shipment of shipments) {
    const trackingNumber = shipment.trackingNumber;
    if (!trackingNumber) {
      skipped += 1;
      continue;
    }

    const data = await fetchFlashTrackingRoute(trackingNumber);
    if (!data) {
      skipped += 1;
      continue;
    }

    const event = normalizeFlashRoutesResponse(data);
    await callInternal("/shipments/carrier-event", event);
    synced += 1;
  }

  return { checked: shipments.length, synced, skipped };
}
