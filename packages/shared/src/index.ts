export * from "./taxonomy";
export * from "./enums";
export * from "./schemas";
export * from "./dto";

export const SOCKET_EVENTS = {
  RECENT_SALE: "marketplace:recent-sale",
  PRICE_UPDATE: "marketplace:price-update",
  SHIPMENT_UPDATE: "shipment:update",
} as const;

export const QUEUE_NAMES = {
  PRICE_AGGREGATION: "price-aggregation",
  ESCROW_RELEASE: "escrow-release",
  NOTIFICATIONS: "notifications",
  SHIPMENT_POLL: "shipment-poll",
} as const;
