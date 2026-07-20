import type { Carrier, ShipmentStatus } from "@cardverse/shared";

export interface ManualShipmentUpdate {
  carrier?: Carrier;
  trackingNumber?: string;
  status?: ShipmentStatus;
  note?: string;
}

export function normalizeShipmentUpdate(input: ManualShipmentUpdate) {
  return {
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    status: input.status ?? "SHIPPED",
    note: input.note,
  };
}

export function orderStatusForShipment(status: ShipmentStatus) {
  if (status === "DELIVERED") return "DELIVERED";
  if (["CONFIRMED", "PACKED", "SHIPPED", "LABEL_CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) {
    return "SHIPPED";
  }
  if (status === "CANCELLED") return "CANCELLED";
  return null;
}

const SHIPPED_OR_LATER: ShipmentStatus[] = [
  "SHIPPED",
  "LABEL_CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function assertValidShipmentTransition(
  current: ShipmentStatus | null | undefined,
  next: ShipmentStatus,
) {
  if (!current || current === "PENDING") return;
  if (SHIPPED_OR_LATER.includes(current) && next === "FAILED") {
    throw new Error("SHIPMENT_CANNOT_FAIL_AFTER_SHIPPED");
  }
}
