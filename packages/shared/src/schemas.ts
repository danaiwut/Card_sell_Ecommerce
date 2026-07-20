import { z } from "zod";
import {
  CARD_CONDITIONS,
  CARRIERS,
  LISTING_ITEM_TYPES,
  NEWS_KIND,
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

export const createListingSchema = z
  .object({
    catalogItemId: z.string().min(1, "เลือกการ์ดจาก catalog"),
    itemType: z.enum(LISTING_ITEM_TYPES).default("SINGLE_CARD"),
    price: z.number().positive("ราคาต้องมากกว่า 0"),
    condition: z.enum(CARD_CONDITIONS).optional(),
    grade: z.number().int().min(1).max(10).optional(),
    imageUrls: z.array(z.string().url()).max(5).optional(),
    quantity: z.number().int().min(1).default(1),
    description: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === "SINGLE_CARD") {
      if (data.grade == null) {
        ctx.addIssue({ code: "custom", message: "กรุณาระบุเกรดการ์ด 1-10", path: ["grade"] });
      }
      if (!data.condition) {
        ctx.addIssue({ code: "custom", message: "กรุณาเลือกสภาพการ์ด", path: ["condition"] });
      }
    } else if (data.grade != null) {
      ctx.addIssue({ code: "custom", message: "กล่องไม่ต้องระบุเกรด", path: ["grade"] });
    }
  });
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const createCatalogItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional(),
  brandId: z.string().optional(),
  setId: z.string().optional(),
  rarity: z.enum(RARITIES).optional(),
  cardNumber: z.string().trim().max(40).optional(),
  imageUrl: z.string().trim().url().optional(),
  images: z.array(z.string().url()).optional(),
});
export type CreateCatalogItemInput = z.infer<typeof createCatalogItemSchema>;

export const rejectOfferSchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผล").max(500),
});
export type RejectOfferInput = z.infer<typeof rejectOfferSchema>;

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

const newsFields = {
  kind: z.enum(NEWS_KIND).default("NEWS"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional().nullable(),
  body: z.string().trim().max(20000).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  eventDate: z.string().trim().optional().nullable(),
};

export const createNewsSchema = z.object({
  slug: z.string().trim().min(1).max(80).optional(),
  ...newsFields,
});
export type CreateNewsInput = z.infer<typeof createNewsSchema>;

export const ingestNewsSchema = z.object({
  sourceUrl: z.string().trim().url(),
  sourceName: z.string().trim().max(120).optional().nullable(),
  externalId: z.string().trim().max(200).optional().nullable(),
  published: z.literal(false).optional(),
  ...newsFields,
});
export type IngestNewsInput = z.infer<typeof ingestNewsSchema>;

export const updateNewsSchema = z.object({
  slug: z.string().trim().min(1).max(80).optional(),
  kind: z.enum(NEWS_KIND).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  excerpt: z.string().trim().max(500).optional().nullable(),
  body: z.string().trim().max(20000).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  eventDate: z.string().trim().optional().nullable(),
  sourceUrl: z.string().trim().url().optional().nullable(),
  sourceName: z.string().trim().max(120).optional().nullable(),
  externalId: z.string().trim().max(200).optional().nullable(),
  published: z.boolean().optional(),
});
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;

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

export const createOfferSchema = z.object({
  amount: z.number().positive("ราคาที่เสนอต้องมากกว่า 0"),
  message: z.string().trim().max(500).optional(),
});
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const adminUsersQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  role: z.enum(["customer", "manager", "admin"]).optional(),
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const priceRangeWindow = z.enum(["TODAY", "7D", "30D", "90D", "1Y"]);
export type PriceRangeWindow = z.infer<typeof priceRangeWindow>;
