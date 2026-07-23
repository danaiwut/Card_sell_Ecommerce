import type { JsonRecord } from "../types/json.js";
import type { ProductType, Rarity } from "@cardverse/shared";

export interface CatalogItemRecord extends JsonRecord {
  slug: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  brandId: string | null;
  setId: string | null;
  rarity: Rarity | null;
  cardNumber: string | null;
  imageUrl: string | null;
  images: string[];
}

export interface ProductRecord extends JsonRecord {
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  type: ProductType;
  price: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  isPreOrder: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  rarity: Rarity | null;
  soldCount: number;
  catalogItemId: string | null;
}
