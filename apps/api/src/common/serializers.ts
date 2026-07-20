import type {
  CatalogItemDto,
  ListingDto,
  ProductDto,
  TradeDto,
  CategoryDto,
} from "@cardverse/shared";

/** satang (int) -> baht (number) for the API surface */
export const toBaht = (satang: number) => Math.round(satang) / 100;
/** baht (number) -> satang (int) for storage */
export const toSatang = (baht: number) => Math.round(baht * 100);

export function serializeCategory(c: any): CategoryDto {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    nameTh: c.nameTh,
    emoji: c.emoji,
  };
}

export function serializeCatalogItem(ci: any): CatalogItemDto {
  return {
    id: ci.id,
    slug: ci.slug,
    name: ci.name,
    rarity: ci.rarity ?? null,
    cardNumber: ci.cardNumber ?? null,
    imageUrl: ci.imageUrl ?? null,
    category: serializeCategory(ci.category),
    subcategoryName: ci.subcategory?.name ?? null,
    brandName: ci.brand?.name ?? null,
    setName: ci.set?.name ?? null,
  };
}

export function serializeProduct(p: any): ProductDto {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle ?? null,
    type: p.type,
    price: toBaht(p.price),
    stock: p.stock,
    imageUrl: p.imageUrl ?? null,
    images: p.images ?? [],
    isPreOrder: p.isPreOrder,
    rarity: p.rarity ?? null,
    soldCount: p.soldCount ?? 0,
    catalogItem: p.catalogItem ? serializeCatalogItem(p.catalogItem) : null,
  };
}

export function serializeListing(l: any): ListingDto {
  return {
    id: l.id,
    price: toBaht(l.price),
    itemType: l.itemType ?? "SINGLE_CARD",
    condition: l.condition,
    grade: l.grade ?? null,
    imageUrls: l.imageUrls ?? [],
    quantity: l.quantity,
    description: l.description ?? null,
    status: l.status,
    catalogItem: serializeCatalogItem(l.catalogItem),
    seller: {
      id: l.seller.id,
      displayName: l.seller.displayName,
      rating: l.seller.sellerRating,
      ratingCount: l.seller.sellerRatingCount,
    },
  };
}

export function serializeListingOffer(o: any) {
  return {
    id: o.id,
    listingId: o.listingId,
    amount: toBaht(o.amount),
    message: o.message ?? null,
    status: o.status,
    rejectReason: o.rejectReason ?? null,
    createdAt: o.createdAt.toISOString(),
    buyer: {
      id: o.buyer.id,
      displayName: o.buyer.displayName,
    },
    listing: {
      id: o.listing.id,
      price: toBaht(o.listing.price),
      itemType: o.listing.itemType ?? "SINGLE_CARD",
      catalogItem: {
        id: o.listing.catalogItem.id,
        name: o.listing.catalogItem.name,
        slug: o.listing.catalogItem.slug,
        imageUrl: o.listing.catalogItem.imageUrl ?? null,
      },
    },
  };
}

export function serializeTrade(t: any): TradeDto {
  return {
    id: t.id,
    price: toBaht(t.price),
    soldAt: t.soldAt.toISOString(),
    catalogItem: {
      id: t.catalogItem.id,
      name: t.catalogItem.name,
      slug: t.catalogItem.slug,
      imageUrl: t.catalogItem.imageUrl ?? null,
    },
    sellerName: t.seller.displayName,
  };
}

export const catalogItemInclude = {
  category: true,
  subcategory: true,
  brand: true,
  set: true,
} as const;
