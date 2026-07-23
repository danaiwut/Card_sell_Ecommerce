export type ModelName =
  | "user"
  | "wallet"
  | "walletTransaction"
  | "withdrawalRequest"
  | "topUpRequest"
  | "address"
  | "category"
  | "subcategory"
  | "brand"
  | "cardSet"
  | "catalogItem"
  | "product"
  | "cart"
  | "cartItem"
  | "order"
  | "orderItem"
  | "coupon"
  | "listing"
  | "listingOffer"
  | "marketplaceOrder"
  | "trade"
  | "pricePoint"
  | "sellerReview"
  | "productReview"
  | "shipment"
  | "shipmentEvent"
  | "collectionItem"
  | "notification"
  | "newsPost"
  | "platformSetting";

export const MODEL_FILES: Record<ModelName, string> = {
  user: "users.json",
  wallet: "wallets.json",
  walletTransaction: "transactions.json",
  withdrawalRequest: "withdrawal-requests.json",
  topUpRequest: "top-up-requests.json",
  address: "addresses.json",
  category: "categories.json",
  subcategory: "subcategories.json",
  brand: "brands.json",
  cardSet: "card-sets.json",
  catalogItem: "catalog-items.json",
  product: "products.json",
  cart: "carts.json",
  cartItem: "cart-items.json",
  order: "orders.json",
  orderItem: "order-items.json",
  coupon: "coupons.json",
  listing: "listings.json",
  listingOffer: "offers.json",
  marketplaceOrder: "marketplace-orders.json",
  trade: "trades.json",
  pricePoint: "price-points.json",
  sellerReview: "reviews.json",
  productReview: "product-reviews.json",
  shipment: "shipments.json",
  shipmentEvent: "shipment-events.json",
  collectionItem: "collection-items.json",
  notification: "notifications.json",
  newsPost: "news.json",
  platformSetting: "settings.json",
};

export const DATE_FIELDS: Partial<Record<ModelName, readonly string[]>> = {
  user: ["createdAt", "updatedAt", "passwordResetExpiresAt"],
  wallet: ["createdAt", "updatedAt"],
  walletTransaction: ["createdAt"],
  withdrawalRequest: ["createdAt", "updatedAt", "processedAt"],
  topUpRequest: ["createdAt", "updatedAt", "processedAt"],
  address: ["createdAt", "updatedAt"],
  category: ["createdAt", "updatedAt"],
  subcategory: ["createdAt", "updatedAt"],
  brand: ["createdAt", "updatedAt"],
  cardSet: ["createdAt", "updatedAt", "releaseDate"],
  catalogItem: ["createdAt", "updatedAt", "releaseDate"],
  product: ["createdAt", "updatedAt"],
  cart: ["createdAt", "updatedAt"],
  cartItem: ["createdAt", "updatedAt"],
  order: ["createdAt", "updatedAt"],
  orderItem: ["createdAt"],
  coupon: ["createdAt", "updatedAt", "expiresAt"],
  listing: ["createdAt", "updatedAt"],
  listingOffer: ["createdAt", "updatedAt"],
  marketplaceOrder: [
    "createdAt",
    "updatedAt",
    "shippedAt",
    "deliveredAt",
    "completedAt",
    "releaseDueAt",
  ],
  trade: ["createdAt", "soldAt"],
  pricePoint: ["day"],
  sellerReview: ["createdAt"],
  productReview: ["createdAt"],
  shipment: ["createdAt", "updatedAt", "lastTrackedAt", "lastCourierSyncAt"],
  shipmentEvent: ["at", "receivedAt"],
  collectionItem: ["acquiredAt"],
  notification: ["createdAt"],
  newsPost: ["createdAt", "updatedAt", "eventDate", "importedAt"],
};

export const MODEL_DEFAULTS: Partial<Record<ModelName, Record<string, unknown>>> = {
  user: {
    role: "customer",
    level: 1,
    sellerRating: 0,
    sellerRatingCount: 0,
    stripeConnectOnboarded: false,
    passwordHash: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
  },
  wallet: { balance: 0, heldBalance: 0 },
  product: {
    type: "SINGLE_CARD",
    stock: 0,
    images: [],
    isPreOrder: false,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    soldCount: 0,
  },
  cartItem: { quantity: 1 },
  order: { shipping: 0, discount: 0, status: "PENDING" },
  listing: { itemType: "SINGLE_CARD", condition: "NEAR_MINT", quantity: 1, status: "ACTIVE", imageUrls: [] },
  listingOffer: { status: "PENDING" },
  marketplaceOrder: { status: "PENDING_PAYMENT", platformFee: 0, sellerPayout: 0, quantity: 1 },
  shipment: { status: "PENDING", autoTrackingEnabled: false },
  shipmentEvent: { accepted: true },
  collectionItem: { quantity: 1 },
  notification: { read: false },
  newsPost: { kind: "NEWS", published: true },
  coupon: { timesRedeemed: 0, active: true },
  withdrawalRequest: { status: "PENDING" },
  topUpRequest: { status: "PENDING" },
  catalogItem: { images: [] },
};

/** Composite / scalar unique indexes used by upsert/findUnique. */
export const UNIQUE_KEYS: Record<ModelName, Record<string, readonly string[]>> = {
  user: { id: ["id"], clerkId: ["clerkId"], email: ["email"] },
  wallet: { id: ["id"], userId: ["userId"] },
  walletTransaction: { id: ["id"] },
  withdrawalRequest: { id: ["id"] },
  topUpRequest: { id: ["id"] },
  address: { id: ["id"] },
  category: { id: ["id"], slug: ["slug"] },
  subcategory: { id: ["id"] },
  brand: { id: ["id"], slug: ["slug"] },
  cardSet: { id: ["id"], slug: ["slug"] },
  catalogItem: { id: ["id"], slug: ["slug"] },
  product: { id: ["id"], slug: ["slug"] },
  cart: { id: ["id"], userId: ["userId"] },
  cartItem: { id: ["id"], cartId_productId: ["cartId", "productId"] },
  order: { id: ["id"], orderNumber: ["orderNumber"] },
  orderItem: { id: ["id"] },
  coupon: { id: ["id"], code: ["code"] },
  listing: { id: ["id"] },
  listingOffer: { id: ["id"] },
  marketplaceOrder: { id: ["id"] },
  trade: { id: ["id"], marketplaceOrderId: ["marketplaceOrderId"] },
  pricePoint: { id: ["id"], catalogItemId_day: ["catalogItemId", "day"] },
  sellerReview: { id: ["id"], orderId: ["orderId"] },
  productReview: { id: ["id"], orderItemId: ["orderItemId"] },
  shipment: { id: ["id"], orderId: ["orderId"], marketplaceOrderId: ["marketplaceOrderId"] },
  shipmentEvent: { id: ["id"] },
  collectionItem: { id: ["id"], userId_catalogItemId: ["userId", "catalogItemId"] },
  notification: { id: ["id"] },
  newsPost: { id: ["id"], slug: ["slug"], sourceUrl: ["sourceUrl"] },
  platformSetting: { id: ["id"], key: ["key"] },
};

export type RelationKind = "many-to-one" | "one-to-many" | "one-to-one";

export interface RelationDef {
  kind: RelationKind;
  model: ModelName;
  fk: string;
  /** FK lives on the related model pointing back (e.g. shipment.orderId). */
  reverse?: boolean;
  optional?: boolean;
}

export const RELATIONS: Record<ModelName, Record<string, RelationDef>> = {
  user: {
    addresses: { kind: "one-to-many", model: "address", fk: "userId" },
    cart: { kind: "one-to-one", model: "cart", fk: "userId", reverse: true },
    orders: { kind: "one-to-many", model: "order", fk: "userId" },
    listings: { kind: "one-to-many", model: "listing", fk: "sellerId" },
    salesAsSeller: { kind: "one-to-many", model: "marketplaceOrder", fk: "sellerId" },
    purchasesAsBuyer: { kind: "one-to-many", model: "marketplaceOrder", fk: "buyerId" },
    trades: { kind: "one-to-many", model: "trade", fk: "sellerId" },
    collection: { kind: "one-to-many", model: "collectionItem", fk: "userId" },
    notifications: { kind: "one-to-many", model: "notification", fk: "userId" },
    offersMade: { kind: "one-to-many", model: "listingOffer", fk: "buyerId" },
    reviewsWritten: { kind: "one-to-many", model: "sellerReview", fk: "authorId" },
    reviewsReceived: { kind: "one-to-many", model: "sellerReview", fk: "sellerId" },
    productReviewsWritten: { kind: "one-to-many", model: "productReview", fk: "authorId" },
    newsPosts: { kind: "one-to-many", model: "newsPost", fk: "authorId" },
    wallet: { kind: "one-to-one", model: "wallet", fk: "userId", reverse: true },
    withdrawals: { kind: "one-to-many", model: "withdrawalRequest", fk: "userId" },
    topUpRequests: { kind: "one-to-many", model: "topUpRequest", fk: "userId" },
  },
  wallet: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
    transactions: { kind: "one-to-many", model: "walletTransaction", fk: "walletId" },
  },
  walletTransaction: {
    wallet: { kind: "many-to-one", model: "wallet", fk: "walletId" },
  },
  withdrawalRequest: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
  },
  topUpRequest: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
  },
  address: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
    orders: { kind: "one-to-many", model: "order", fk: "addressId" },
  },
  category: {
    subcategories: { kind: "one-to-many", model: "subcategory", fk: "categoryId" },
    brands: { kind: "one-to-many", model: "brand", fk: "categoryId" },
    catalogItems: { kind: "one-to-many", model: "catalogItem", fk: "categoryId" },
  },
  subcategory: {
    category: { kind: "many-to-one", model: "category", fk: "categoryId" },
    catalogItems: { kind: "one-to-many", model: "catalogItem", fk: "subcategoryId" },
  },
  brand: {
    category: { kind: "many-to-one", model: "category", fk: "categoryId", optional: true },
    catalogItems: { kind: "one-to-many", model: "catalogItem", fk: "brandId" },
  },
  cardSet: {
    catalogItems: { kind: "one-to-many", model: "catalogItem", fk: "setId" },
  },
  catalogItem: {
    category: { kind: "many-to-one", model: "category", fk: "categoryId" },
    subcategory: { kind: "many-to-one", model: "subcategory", fk: "subcategoryId", optional: true },
    brand: { kind: "many-to-one", model: "brand", fk: "brandId", optional: true },
    set: { kind: "many-to-one", model: "cardSet", fk: "setId", optional: true },
    products: { kind: "one-to-many", model: "product", fk: "catalogItemId" },
    listings: { kind: "one-to-many", model: "listing", fk: "catalogItemId" },
    trades: { kind: "one-to-many", model: "trade", fk: "catalogItemId" },
    pricePoints: { kind: "one-to-many", model: "pricePoint", fk: "catalogItemId" },
    collection: { kind: "one-to-many", model: "collectionItem", fk: "catalogItemId" },
  },
  product: {
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId", optional: true },
    cartItems: { kind: "one-to-many", model: "cartItem", fk: "productId" },
    orderItems: { kind: "one-to-many", model: "orderItem", fk: "productId" },
    reviews: { kind: "one-to-many", model: "productReview", fk: "productId" },
  },
  cart: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
    items: { kind: "one-to-many", model: "cartItem", fk: "cartId" },
  },
  cartItem: {
    cart: { kind: "many-to-one", model: "cart", fk: "cartId" },
    product: { kind: "many-to-one", model: "product", fk: "productId" },
  },
  order: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
    items: { kind: "one-to-many", model: "orderItem", fk: "orderId" },
    shipment: { kind: "one-to-one", model: "shipment", fk: "orderId", reverse: true },
    address: { kind: "many-to-one", model: "address", fk: "addressId", optional: true },
    coupon: { kind: "many-to-one", model: "coupon", fk: "couponId", optional: true },
    productReviews: { kind: "one-to-many", model: "productReview", fk: "orderId" },
  },
  orderItem: {
    order: { kind: "many-to-one", model: "order", fk: "orderId" },
    product: { kind: "many-to-one", model: "product", fk: "productId" },
    review: { kind: "one-to-one", model: "productReview", fk: "orderItemId", reverse: true },
  },
  coupon: {
    orders: { kind: "one-to-many", model: "order", fk: "couponId" },
  },
  listing: {
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId" },
    seller: { kind: "many-to-one", model: "user", fk: "sellerId" },
    orders: { kind: "one-to-many", model: "marketplaceOrder", fk: "listingId" },
    offers: { kind: "one-to-many", model: "listingOffer", fk: "listingId" },
  },
  listingOffer: {
    listing: { kind: "many-to-one", model: "listing", fk: "listingId" },
    buyer: { kind: "many-to-one", model: "user", fk: "buyerId" },
  },
  marketplaceOrder: {
    listing: { kind: "many-to-one", model: "listing", fk: "listingId" },
    buyer: { kind: "many-to-one", model: "user", fk: "buyerId" },
    seller: { kind: "many-to-one", model: "user", fk: "sellerId" },
    shipment: { kind: "one-to-one", model: "shipment", fk: "marketplaceOrderId", reverse: true },
    trade: { kind: "one-to-one", model: "trade", fk: "marketplaceOrderId", reverse: true },
    review: { kind: "one-to-one", model: "sellerReview", fk: "orderId", reverse: true },
  },
  trade: {
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId" },
    marketplaceOrder: { kind: "many-to-one", model: "marketplaceOrder", fk: "marketplaceOrderId" },
    seller: { kind: "many-to-one", model: "user", fk: "sellerId" },
  },
  pricePoint: {
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId" },
  },
  sellerReview: {
    order: { kind: "many-to-one", model: "marketplaceOrder", fk: "orderId" },
    author: { kind: "many-to-one", model: "user", fk: "authorId" },
    seller: { kind: "many-to-one", model: "user", fk: "sellerId" },
  },
  productReview: {
    order: { kind: "many-to-one", model: "order", fk: "orderId" },
    orderItem: { kind: "many-to-one", model: "orderItem", fk: "orderItemId" },
    product: { kind: "many-to-one", model: "product", fk: "productId" },
    author: { kind: "many-to-one", model: "user", fk: "authorId" },
  },
  shipment: {
    order: { kind: "many-to-one", model: "order", fk: "orderId", optional: true },
    marketplaceOrder: {
      kind: "many-to-one",
      model: "marketplaceOrder",
      fk: "marketplaceOrderId",
      optional: true,
    },
    events: { kind: "one-to-many", model: "shipmentEvent", fk: "shipmentId" },
  },
  shipmentEvent: {
    shipment: { kind: "many-to-one", model: "shipment", fk: "shipmentId", optional: true },
  },
  collectionItem: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId" },
  },
  notification: {
    user: { kind: "many-to-one", model: "user", fk: "userId" },
  },
  newsPost: {
    author: { kind: "many-to-one", model: "user", fk: "authorId", optional: true },
  },
  platformSetting: {},
};

/** Reverse lookup: nested filter field -> relation on target model */
export const NESTED_FILTER_RELATIONS: Partial<Record<ModelName, Record<string, RelationDef>>> = {
  cartItem: {
    cart: { kind: "many-to-one", model: "cart", fk: "cartId" },
  },
  product: {
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId", optional: true },
  },
  listing: {
    catalogItem: { kind: "many-to-one", model: "catalogItem", fk: "catalogItemId" },
    seller: { kind: "many-to-one", model: "user", fk: "sellerId" },
  },
  catalogItem: {
    category: { kind: "many-to-one", model: "category", fk: "categoryId" },
    subcategory: { kind: "many-to-one", model: "subcategory", fk: "subcategoryId", optional: true },
  },
  listingOffer: {
    listing: { kind: "many-to-one", model: "listing", fk: "listingId" },
  },
};

export const ALL_MODELS = Object.keys(MODEL_FILES) as ModelName[];
