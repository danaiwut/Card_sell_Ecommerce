import type { ListingDto, Paginated } from "@cardverse/shared";
import { fetchPublic } from "@/lib/api-client/server";
import { MarketplacePageClient } from "@/components/marketplace/marketplace-page-client";

export const revalidate = 60;

type SearchParams = Record<string, string | string[] | undefined>;

function buildQueryString(params: SearchParams): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") sp.set(key, value);
    else if (Array.isArray(value) && value[0]) sp.set(key, value[0]);
  }
  if (!sp.has("pageSize")) sp.set("pageSize", "16");
  return sp.toString();
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const queryString = buildQueryString(params);

  const [categories, listings] = await Promise.all([
    fetchPublic<{ id: string; slug: string; name: string; nameTh: string }[]>("/categories", {
      tags: ["categories"],
    }),
    fetchPublic<Paginated<ListingDto>>(`/marketplace/listings?${queryString}`, {
      tags: ["listings", queryString],
    }),
  ]);

  return (
    <MarketplacePageClient
      initialCategories={categories}
      initialListings={listings}
      initialQueryString={queryString}
    />
  );
}
