import type { NormalizedCarrierEvent, ShipmentStatus } from "@cardverse/shared";

interface FlashEnvelope {
  data?: FlashTrackingPayload;
}

interface FlashTrackingPayload {
  pno?: string;
  origPno?: string | null;
  recentPno?: string | null;
  state?: string | number;
  stateText?: string | null;
  stateChangeAt?: string | number | null;
  stateDate?: string | number | null;
  updateAt?: string | number | null;
  routedAction?: string | null;
  routeAction?: string | null;
  message?: string | null;
  routedAt?: string | number | null;
  routes?: FlashTrackingPayload[];
}

export function normalizeFlashWebhook(rawPayload: unknown): NormalizedCarrierEvent {
  const envelope = rawPayload as FlashEnvelope;
  return normalizeFlashPayload(envelope.data ?? {}, rawPayload);
}

export function normalizeFlashRoutesResponse(data: unknown): NormalizedCarrierEvent {
  const payload = data as FlashTrackingPayload;
  const latestRoute = [...(payload.routes ?? [])].sort(
    (a, b) => timestampMs(b.routedAt) - timestampMs(a.routedAt),
  )[0];
  return normalizeFlashPayload({ ...payload, ...latestRoute }, data);
}

function normalizeFlashPayload(
  payload: FlashTrackingPayload,
  rawPayload: unknown,
): NormalizedCarrierEvent {
  const trackingNumber = payload.recentPno ?? payload.pno ?? payload.origPno;
  if (!trackingNumber) {
    throw new Error("Flash payload does not include a tracking number");
  }

  const rawStatus = String(payload.state ?? payload.stateText ?? "unknown");
  const timestamp = flashTimestampToDate(
    payload.routedAt ?? payload.stateDate ?? payload.stateChangeAt ?? payload.updateAt,
  );
  const action = payload.routedAction ?? payload.routeAction ?? payload.stateText ?? rawStatus;

  return {
    courier: "FLASH",
    trackingNumber,
    status: flashStateToShipmentStatus(payload.state ?? "0"),
    rawStatus,
    timestamp: timestamp.toISOString(),
    eventKey: `FLASH:${trackingNumber}:${action}:${timestamp.getTime()}:${rawStatus}`,
    note: payload.message ?? payload.stateText ?? undefined,
    rawPayload,
  };
}

function flashStateToShipmentStatus(state: string | number): ShipmentStatus {
  switch (String(state)) {
    case "1":
    case "2":
      return "SHIPPED";
    case "3":
      return "OUT_FOR_DELIVERY";
    case "5":
      return "DELIVERED";
    case "7":
    case "8":
    case "9":
      return "CANCELLED";
    case "4":
    case "6":
      return "EXCEPTION";
    default:
      return "PENDING";
  }
}

function flashTimestampToDate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return new Date();
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function timestampMs(value: string | number | null | undefined) {
  return flashTimestampToDate(value).getTime();
}
