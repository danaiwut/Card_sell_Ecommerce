/** Prisma-shaped model types for JsonClient inference */

export interface User {
  id: string;
  clerkId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "customer" | "manager" | "admin";
  level: number;
  stripeConnectAccountId: string | null;
  stripeConnectOnboarded: boolean;
  stripeCustomerId: string | null;
  sellerRating: number;
  sellerRatingCount: number;
  passwordHash: string | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  heldBalance: number;
  createdAt: Date;
  updatedAt: Date;
  user: JsonResult<User>;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdById: string | null;
  createdAt: Date;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: string;
  note: string | null;
  managerNote: string | null;
  processedById: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: JsonResult<User>;
}

export interface TopUpRequest {
  id: string;
  userId: string;
  amount: number;
  status: string;
  note: string | null;
  managerNote: string | null;
  processedById: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: JsonResult<User>;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  emoji: string;
  note: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  subcategories: JsonResult<Subcategory>[];
  _count: { catalogItems: number };
}

export interface Subcategory {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  categoryId: string | null;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardSet {
  id: string;
  slug: string;
  name: string;
  releaseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  brandId: string | null;
  setId: string | null;
  rarity: string | null;
  cardNumber: string | null;
  releaseDate: Date | null;
  imageUrl: string | null;
  images: string[];
  attributes: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  isPreOrder: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  rarity: string | null;
  soldCount: number;
  catalogItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
  catalogItem?: JsonResult<CatalogItem> | null;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  items: JsonResult<CartItem>[];
  user?: JsonResult<User>;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: JsonResult<Product>;
  cart?: JsonResult<Cart>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponId: string | null;
  addressId: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: JsonResult<OrderItem>[];
  shipment?: JsonResult<Shipment> | null;
  user: JsonResult<User>;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  createdAt: Date;
  product: JsonResult<Product>;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  percentOff: number | null;
  amountOff: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  catalogItemId: string;
  sellerId: string;
  itemType: string;
  price: number;
  condition: string;
  grade: number | null;
  imageUrls: string[];
  quantity: number;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingOffer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  message: string | null;
  status: string;
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOrder {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  quantity: number;
  addressSnapshot: unknown;
  stripePaymentIntentId: string | null;
  stripeTransferId: string | null;
  stripeChargeId: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  releaseDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  catalogItemId: string;
  marketplaceOrderId: string;
  sellerId: string;
  price: number;
  soldAt: Date;
  createdAt: Date;
}

export interface PricePoint {
  id: string;
  catalogItemId: string;
  day: Date;
  avg: number;
  low: number;
  high: number;
  volume: number;
}

export interface SellerReview {
  id: string;
  orderId: string;
  authorId: string;
  sellerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

/** Verified purchase review — one per order line item after delivery. */
export interface ProductReview {
  id: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  authorId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface Shipment {
  id: string;
  orderId: string | null;
  marketplaceOrderId: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PACKED"
    | "SHIPPED"
    | "LABEL_CREATED"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "EXCEPTION"
    | "FAILED";
  autoTrackingEnabled: boolean;
  trackingSource: string | null;
  lastTrackedAt: Date | null;
  lastCourierSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  events?: JsonResult<ShipmentEvent>[];
  order?: JsonResult<Order> | null;
  marketplaceOrder?: JsonResult<MarketplaceOrder> | null;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string | null;
  courier: string | null;
  trackingNumber: string | null;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PACKED"
    | "SHIPPED"
    | "LABEL_CREATED"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "EXCEPTION"
    | "FAILED";
  rawStatus: string | null;
  normalizedStatus: string | null;
  accepted: boolean;
  ignoredReason: string | null;
  eventKey: string | null;
  rawPayload: unknown;
  note: string | null;
  at: Date;
  receivedAt: Date;
}

export interface CollectionItem {
  id: string;
  userId: string;
  catalogItemId: string;
  quantity: number;
  acquiredAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
}

export interface NewsPost {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  imageUrl: string | null;
  published: boolean;
  eventDate: Date | null;
  sourceUrl: string | null;
  externalId: string | null;
  sourceName: string | null;
  importedAt: Date | null;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
}

export type JsonModel =
  | User
  | Wallet
  | WalletTransaction
  | WithdrawalRequest
  | TopUpRequest
  | Address
  | Category
  | Subcategory
  | Brand
  | CardSet
  | CatalogItem
  | Product
  | Cart
  | CartItem
  | Order
  | OrderItem
  | Coupon
  | Listing
  | ListingOffer
  | MarketplaceOrder
  | Trade
  | PricePoint
  | SellerReview
  | ProductReview
  | Shipment
  | ShipmentEvent
  | CollectionItem
  | Notification
  | NewsPost
  | PlatformSetting;

/** Result rows may include relation payloads from `include`. */
export type JsonResult<T> = T & { [key: string]: any };
