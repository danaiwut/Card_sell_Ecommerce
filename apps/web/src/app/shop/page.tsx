import type { Paginated, ProductDto } from "@cardverse/shared";
import { fetchPublic } from "@/lib/api-client/server";
import { ShopPageClient } from "@/components/shop/shop-page-client";

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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const queryString = buildQueryString(params);

  const [categories, products] = await Promise.all([
    fetchPublic<{ id: string; slug: string; name: string; nameTh: string }[]>("/categories", {
      tags: ["categories"],
    }),
    fetchPublic<Paginated<ProductDto>>(`/products?${queryString}`, {
      tags: ["products", queryString],
    }),
  ]);

  return (
    <ShopPageClient
      initialCategories={categories}
      initialProducts={products}
      initialQueryString={queryString}
    />
  );
}
