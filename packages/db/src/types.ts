/** Prisma-compatible enum exports for apps that import from @cardverse/db */

export const Role = {
  customer: "customer",
  manager: "manager",
  admin: "admin",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ProductType = {
  BOOSTER_BOX: "BOOSTER_BOX",
  DECK: "DECK",
  SINGLE_CARD: "SINGLE_CARD",
  ACCESSORY: "ACCESSORY",
} as const;

export const Rarity = {
  C: "C",
  UC: "UC",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
  SECRET: "SECRET",
  PROMO: "PROMO",
} as const;

export const CardCondition = {
  MINT: "MINT",
  NEAR_MINT: "NEAR_MINT",
  EXCELLENT: "EXCELLENT",
  GOOD: "GOOD",
  PLAYED: "PLAYED",
  DAMAGED: "DAMAGED",
} as const;

export const ListingStatus = {
  ACTIVE: "ACTIVE",
  SOLD: "SOLD",
  CANCELLED: "CANCELLED",
  SUSPENDED: "SUSPENDED",
} as const;

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export const MarketplaceOrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID_HELD: "PAID_HELD",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  DISPUTED: "DISPUTED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;

export const ShipmentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  LABEL_CREATED: "LABEL_CREATED",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  EXCEPTION: "EXCEPTION",
  FAILED: "FAILED",
} as const;

export const Carrier = {
  THAILAND_POST: "THAILAND_POST",
  KERRY: "KERRY",
  FLASH: "FLASH",
  JT: "JT",
  NINJA_VAN: "NINJA_VAN",
  DHL: "DHL",
  OTHER: "OTHER",
} as const;

export const NewsKind = {
  NEWS: "NEWS",
  EVENT: "EVENT",
  SET_RELEASE: "SET_RELEASE",
  PRICE_UPDATE: "PRICE_UPDATE",
} as const;

export const OfferStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export const ListingItemType = {
  SINGLE_CARD: "SINGLE_CARD",
  BOX: "BOX",
} as const;

export const NotificationType = {
  ORDER_UPDATE: "ORDER_UPDATE",
  SHIPMENT_UPDATE: "SHIPMENT_UPDATE",
  MARKETPLACE_SALE: "MARKETPLACE_SALE",
  PRICE_ALERT: "PRICE_ALERT",
  PAYOUT: "PAYOUT",
  SYSTEM: "SYSTEM",
  CREDIT: "CREDIT",
  WITHDRAWAL: "WITHDRAWAL",
} as const;

export const WalletTransactionType = {
  TOP_UP: "TOP_UP",
  TOP_UP_REJECTED: "TOP_UP_REJECTED",
  ADMIN_GRANT: "ADMIN_GRANT",
  PURCHASE: "PURCHASE",
  ESCROW_HOLD: "ESCROW_HOLD",
  ESCROW_RELEASE: "ESCROW_RELEASE",
  WITHDRAWAL: "WITHDRAWAL",
  WITHDRAWAL_REFUND: "WITHDRAWAL_REFUND",
  REFUND: "REFUND",
} as const;

export const WithdrawalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
} as const;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export namespace Prisma {
  export type JsonValue = import("./types").JsonValue;
}
