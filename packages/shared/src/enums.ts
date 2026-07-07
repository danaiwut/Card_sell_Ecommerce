export const ROLES = ["customer", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCT_TYPES = [
  "BOOSTER_BOX",
  "DECK",
  "SINGLE_CARD",
  "ACCESSORY",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const RARITIES = [
  "C",
  "UC",
  "R",
  "SR",
  "SSR",
  "UR",
  "SECRET",
  "PROMO",
] as const;
export type Rarity = (typeof RARITIES)[number];

export const CARD_CONDITIONS = [
  "MINT",
  "NEAR_MINT",
  "EXCELLENT",
  "GOOD",
  "PLAYED",
  "DAMAGED",
] as const;
export type CardCondition = (typeof CARD_CONDITIONS)[number];

export const LISTING_STATUS = [
  "ACTIVE",
  "SOLD",
  "CANCELLED",
  "SUSPENDED",
] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];

/**
 * Marketplace escrow order lifecycle.
 * PENDING_PAYMENT -> PAID_HELD -> SHIPPED -> DELIVERED -> COMPLETED
 * any -> REFUNDED / DISPUTED (admin)
 */
export const MARKETPLACE_ORDER_STATUS = [
  "PENDING_PAYMENT",
  "PAID_HELD",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "DISPUTED",
  "REFUNDED",
  "CANCELLED",
] as const;
export type MarketplaceOrderStatus = (typeof MARKETPLACE_ORDER_STATUS)[number];

export const ORDER_STATUS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const SHIPMENT_STATUS = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "LABEL_CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "EXCEPTION",
  "FAILED",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUS)[number];

export const SHIPMENT_TERMINAL_STATUS = [
  "DELIVERED",
  "CANCELLED",
  "EXCEPTION",
  "FAILED",
] as const satisfies readonly ShipmentStatus[];

export const SHIPMENT_AUTO_TRACKING_CARRIERS = ["FLASH"] as const;

export const CARRIERS = [
  "THAILAND_POST",
  "KERRY",
  "FLASH",
  "JT",
  "NINJA_VAN",
  "DHL",
  "OTHER",
] as const;
export type Carrier = (typeof CARRIERS)[number];

export const NEWS_KIND = ["NEWS", "EVENT", "SET_RELEASE", "PRICE_UPDATE"] as const;
export type NewsKind = (typeof NEWS_KIND)[number];
