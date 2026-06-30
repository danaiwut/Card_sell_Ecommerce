import { z } from "zod";
import {
  CARD_CONDITIONS,
  CARRIERS,
  PRODUCT_TYPES,
  RARITIES,
  SHIPMENT_STATUS,
} from "./enums";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const shopQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
});
export type ShopQuery = z.infer<typeof shopQuerySchema>;

export const marketplaceQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  category: z.string().optional(),
  rarity: z.enum(RARITIES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minSellerRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("price_asc"),
});
export type MarketplaceQuery = z.infer<typeof marketplaceQuerySchema>;

export const createListingSchema = z.object({
  // sellers must reference an existing CatalogItem — no free-form card data
  catalogItemId: z.string().min(1, "เลือกการ์ดจาก catalog"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  condition: z.enum(CARD_CONDITIONS),
  quantity: z.number().int().min(1).default(1),
  description: z.string().max(2000).optional(),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

export const updateShipmentSchema = z.object({
  carrier: z.enum(CARRIERS),
  trackingNumber: z.string().min(3, "เลขพัสดุไม่ถูกต้อง"),
  status: z.enum(SHIPMENT_STATUS).optional(),
  note: z.string().max(500).optional(),
});
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(6),
  line1: z.string().min(1),
  line2: z.string().optional(),
  district: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(4),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const priceRangeWindow = z.enum(["TODAY", "7D", "30D", "90D", "1Y"]);
export type PriceRangeWindow = z.infer<typeof priceRangeWindow>;
