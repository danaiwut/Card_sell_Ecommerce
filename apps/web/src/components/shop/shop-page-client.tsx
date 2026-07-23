"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import type { Paginated, ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/query/keys";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs, PRICE_RANGE_MAX, PRICE_RANGE_MIN, PriceRangeSlider } from "@/components/ui/shop-ui";
import { cn } from "@/lib/format";

const TYPES: { value: string; label: string }[] = [
  { value: "BOOSTER_BOX", label: "Booster Box" },
  { value: "DECK", label: "Deck" },
  { value: "SINGLE_CARD", label: "Single Card" },
  { value: "ACCESSORY", label: "Accessories" },
];

const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
}

interface Props {
  initialCategories: CategoryRow[];
  initialProducts: Paginated<ProductDto>;
  initialQueryString: string;
}

export function ShopPageClient({
  initialCategories,
  initialProducts,
  initialQueryString,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  const page = parseInt(params.get("page") ?? "1", 10);
  const category = params.get("category") ?? "";
  const type = params.get("type") ?? "";
  const sort = params.get("sort") ?? "newest";
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? String(PRICE_RANGE_MIN));
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? String(PRICE_RANGE_MAX));

  const sliderMin = Math.max(PRICE_RANGE_MIN, Number(minPrice) || PRICE_RANGE_MIN);
  const sliderMax = Math.min(PRICE_RANGE_MAX, Number(maxPrice) || PRICE_RANGE_MAX);

  const sp = new URLSearchParams(params.toString());
  if (!sp.has("pageSize")) sp.set("pageSize", "12");
  const queryString = sp.toString();

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => api.get<CategoryRow[]>("/categories"),
    initialData: initialCategories,
    staleTime: 5 * 60_000,
  });

  const { data } = useQuery({
    queryKey: queryKeys.shop(queryString),
    queryFn: () => api.get<Paginated<ProductDto>>(`/products?${queryString}`),
    initialData: queryString === initialQueryString ? initialProducts : undefined,
    placeholderData: (prev) => prev,
  });

  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 12;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const activeCategory = categories?.find((c) => c.slug === category);
  const pageTitle = activeCategory
    ? locale === "th"
      ? activeCategory.nameTh
      : activeCategory.name
    : "Shop";

  const update = (next: Record<string, string | undefined>) => {
    const freshSp = new URLSearchParams(params.toString());
    if (!Object.prototype.hasOwnProperty.call(next, "page")) {
      freshSp.delete("page");
    }
    for (const [k, v] of Object.entries(next)) {
      if (v) freshSp.set(k, v);
      else freshSp.delete(k);
    }
    router.push(`/shop?${freshSp.toString()}`);
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: pageTitle },
        ]}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="space-y-8 rounded-[20px] border border-black/10 p-6">
            <div>
              <p className="flex items-center justify-between text-sm font-medium">
                Categories
                <ChevronDown size={16} className="text-black/40" />
              </p>
              <ul className="mt-3 space-y-1">
                <li>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      !category
                        ? "bg-surface font-medium text-black"
                        : "text-black/60 hover:bg-surface hover:text-black",
                    )}
                    onClick={() => update({ category: undefined })}
                  >
                    {t("shop.all")}
                  </button>
                </li>
                {(categories ?? []).slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        category === c.slug
                          ? "bg-surface font-medium text-black"
                          : "text-black/60 hover:bg-surface hover:text-black",
                      )}
                      onClick={() => update({ category: c.slug })}
                    >
                      {locale === "th" ? c.nameTh : c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">{t("shop.type")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TYPES.map((ty) => (
                  <button
                    key={ty.value}
                    type="button"
                    onClick={() => update({ type: type === ty.value ? undefined : ty.value })}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      type === ty.value
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-surface text-black/70"
                    }`}
                  >
                    {ty.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">{t("shop.price")}</p>
              <PriceRangeSlider
                minValue={sliderMin}
                maxValue={sliderMax}
                onChange={(min, max) => {
                  setMinPrice(String(min));
                  setMaxPrice(String(max));
                }}
              />
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="input !rounded-xl px-3 py-2 text-xs"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-black/30">—</span>
                <input
                  className="input !rounded-xl px-3 py-2 text-xs"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-primary mt-4 w-full !py-2.5 text-xs"
                onClick={() =>
                  update({
                    minPrice:
                      minPrice && Number(minPrice) > PRICE_RANGE_MIN ? minPrice : undefined,
                    maxPrice:
                      maxPrice && Number(maxPrice) < PRICE_RANGE_MAX ? maxPrice : undefined,
                  })
                }
              >
                {t("common.apply")}
              </button>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[32px] font-black uppercase sm:text-[40px]">{pageTitle}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-black/50">
              <span>
                Showing {from}-{to} of {total} Products
              </span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    Sort by: {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {(data?.items ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-black/10 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
                className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium disabled:opacity-40"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update({ page: String(n) })}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                      n === page ? "bg-black text-white" : "text-black/50 hover:bg-surface"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-black/30">…</span>}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) })}
                className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter link */}
      <div className="mt-6 lg:hidden">
        <Link href="/shop" className="text-sm font-medium underline">
          Filters available on desktop
        </Link>
      </div>
    </div>
  );
}
