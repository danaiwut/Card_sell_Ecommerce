import type {
  Carrier,
  CardCondition,
  ListingItemType,
  MarketplaceOrderStatus,
  OfferStatus,
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
  soldCount?: number;
  rating?: number | null;
  reviewCount?: number;
  catalogItem: CatalogItemDto | null;
}

export interface ProductReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verifiedPurchase: true;
  author: { displayName: string };
}

export interface ListingDto {
  id: string;
  price: number;
  itemType: ListingItemType;
  condition: CardCondition;
  grade: number | null;
  imageUrls: string[];
  quantity: number;
  description?: string | null;
  status?: string;
  catalogItem: CatalogItemDto;
  seller: {
    id: string;
    displayName: string;
    rating: number;
    ratingCount: number;
  };
}

export interface ListingOfferDto {
  id: string;
  listingId: string;
  amount: number;
  message: string | null;
  status: OfferStatus;
  rejectReason: string | null;
  createdAt: string;
  buyer: { id: string; displayName: string };
  listing: {
    id: string;
    price: number;
    itemType: ListingItemType;
    catalogItem: Pick<CatalogItemDto, "id" | "name" | "slug" | "imageUrl">;
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
  autoTrackingEnabled?: boolean;
  trackingSource?: string | null;
  lastTrackedAt?: string | null;
  lastCourierSyncAt?: string | null;
  events: {
    status: ShipmentStatus;
    note?: string | null;
    at: string;
    courier?: Carrier | null;
    rawStatus?: string | null;
    accepted?: boolean;
    ignoredReason?: string | null;
  }[];
}

export interface NormalizedCarrierEvent {
  courier: Carrier;
  trackingNumber: string;
  status: ShipmentStatus;
  rawStatus: string;
  timestamp: string;
  eventKey: string;
  note?: string;
  rawPayload?: unknown;
}

export interface ShipmentUpdateEventDto {
  shipmentId: string;
  orderId: string | null;
  marketplaceOrderId: string | null;
  userIds: string[];
  carrier: Carrier | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  note?: string | null;
  at: string;
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
