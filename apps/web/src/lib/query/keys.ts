/** Shared React Query cache keys grouped by feature. */
export const queryKeys = {
  categories: () => ["categories"] as const,
  shop: (queryString: string) => ["shop", queryString] as const,
  product: (slug: string) => ["product", slug] as const,
  productReviews: (slug: string) => ["product-reviews", slug] as const,
  listings: (queryString: string) => ["listings", queryString] as const,
  catalogItem: (id: string) => ["catalog-item", id] as const,
  marketStats: (id: string) => ["market-stats", id] as const,
  catalogListings: (id: string) => ["catalog-listings", id] as const,
  news: (tab: string) => ["news", tab] as const,
  eventsUpcoming: () => ["events-upcoming"] as const,
  cart: (userId?: string) => ["cart", userId] as const,
  me: (userId?: string) => ["me", userId] as const,
};
