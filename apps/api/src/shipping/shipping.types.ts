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
