import type {
  Carrier,
  CardCondition,
  MarketplaceOrderStatus,
  ProductType,
  Rarity,
  ShipmentStatus,
} from "./enums";

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  emoji: string;
}

export interface CatalogItemDto {
  id: string;
  slug: string;
  name: string;
  rarity: Rarity | null;
  cardNumber: string | null;
  imageUrl: string | null;
  category: CategoryDto;
  subcategoryName: string | null;
  brandName: string | null;
  setName: string | null;
}

export interface ProductDto {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  type: ProductType;
  price: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  isPreOrder: boolean;
  rarity: Rarity | null;
  catalogItem: CatalogItemDto | null;
}

export interface ListingDto {
  id: string;
  price: number;
  condition: CardCondition;
  quantity: number;
  catalogItem: CatalogItemDto;
  seller: {
    id: string;
    displayName: string;
    rating: number;
    ratingCount: number;
  };
}

export interface TradeDto {
  id: string;
  price: number;
  soldAt: string;
  catalogItem: Pick<CatalogItemDto, "id" | "name" | "slug" | "imageUrl">;
  sellerName: string;
}

export interface PricePoint {
  /** ISO date (day bucket) */
  date: string;
  /** average price for the bucket */
  avg: number;
  low: number;
  high: number;
  volume: number;
}

export interface MarketStatsDto {
  catalogItemId: string;
  today: number | null;
  avg7d: number | null;
  avg30d: number | null;
  lowestActiveListing: number | null;
  history: PricePoint[];
}

export interface ShipmentDto {
  id: string;
  carrier: Carrier | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  events: { status: ShipmentStatus; note?: string; at: string }[];
}

export interface MarketplaceOrderDto {
  id: string;
  status: MarketplaceOrderStatus;
  amount: number;
  platformFee: number;
  createdAt: string;
  listing: ListingDto;
  shipment: ShipmentDto | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
