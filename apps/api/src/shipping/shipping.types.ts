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
    status: input.status ?? "IN_TRANSIT",
    note: input.note,
  };
}

export function orderStatusForShipment(status: ShipmentStatus) {
  if (status === "DELIVERED") return "DELIVERED";
  if (["LABEL_CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) {
    return "SHIPPED";
  }
  return null;
}
