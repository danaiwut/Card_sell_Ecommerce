"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Star, SlidersHorizontal, X, ImageOff } from "lucide-react";
import { RARITIES, type ListingDto, type Paginated } from "@cardverse/shared";
import { api } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/query/keys";
import { useI18n } from "@/lib/i18n";
import { formatBaht } from "@/lib/format";
import { RecentSalesFeed } from "@/components/marketplace/recent-sales-feed";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
}

interface Props {
  initialCategories: CategoryRow[];
  initialListings: Paginated<ListingDto>;
  initialQueryString: string;
}

export function MarketplacePageClient({
  initialCategories,
  initialListings,
  initialQueryString,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  const page = parseInt(params.get("page") ?? "1", 10);
  const rarity = params.get("rarity") ?? "";
  const category = params.get("category") ?? "";
  const q = params.get("q") ?? "";
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sp = new URLSearchParams(params.toString());
  if (!sp.has("pageSize")) sp.set("pageSize", "16");
  const queryString = sp.toString();

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => api.get<CategoryRow[]>("/categories"),
    initialData: initialCategories,
    staleTime: 5 * 60_000,
  });

  const { data } = useQuery({
    queryKey: queryKeys.listings(queryString),
    queryFn: () => api.get<Paginated<ListingDto>>(`/marketplace/listings?${queryString}`),
    initialData: queryString === initialQueryString ? initialListings : undefined,
    placeholderData: (prev) => prev,
  });

  const totalPages = data?.totalPages ?? 1;

  const update = (next: Record<string, string | undefined>) => {
    const freshSp = new URLSearchParams(params.toString());
    if (!Object.prototype.hasOwnProperty.call(next, "page")) freshSp.delete("page");
    for (const [k, v] of Object.entries(next)) {
      if (v) freshSp.set(k, v);
      else freshSp.delete(k);
    }
    router.push(`/marketplace?${freshSp.toString()}`);
  };

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <input
          placeholder="Search listings..."
          className="input h-11"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
          }}
        />
        <button
          onClick={() => setIsFilterOpen(true)}
          className="card flex h-11 items-center gap-2 px-4 text-sm font-semibold hover:border-gold hover:text-gold transition whitespace-nowrap cursor-pointer"
        >
          <SlidersHorizontal size={16} /> {t("common.filter")}
        </button>
        <Link href="/account/sell" className="btn-gold h-11 whitespace-nowrap">
          {t("market.sell")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {(data?.items ?? []).map((l) => (
              <Link
                key={l.id}
                href={`/marketplace/${l.catalogItem.id}?listing=${l.id}`}
                className="group card overflow-hidden transition hover:border-gold hover:shadow-md"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
                  {l.catalogItem.imageUrl ? (
                    <Image
                      src={l.catalogItem.imageUrl}
                      alt={l.catalogItem.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink/20">
                      <ImageOff size={32} />
                    </div>
                  )}
                  {l.catalogItem.rarity && (
                    <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
                      {l.catalogItem.rarity}
                    </span>
                  )}
                  <span className="absolute right-2 top-2 rounded bg-gold/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {l.condition.replace("_", " ")}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold text-ink leading-tight">{l.catalogItem.name}</p>
                  {l.catalogItem.setName && (
                    <p className="truncate text-[10px] text-ink/50 mt-0.5">{l.catalogItem.setName}</p>
                  )}
                  <p className="mt-1.5 text-sm font-bold text-gold">{formatBaht(l.price)}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: Math.min(5, Math.round(l.seller.rating)) }).map((_, i) => (
                        <Star key={i} size={8} fill="currentColor" className="text-gold" />
                      ))}
                    </div>
                    <p className="truncate text-[10px] text-ink/50">{l.seller.displayName}</p>
                  </div>
                </div>
              </Link>
            ))}
            {(data?.items.length ?? 0) === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-ink/50">No listings found</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
                className="btn-outline px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &larr; Prev
              </button>
              <span className="text-sm font-semibold text-ink/75">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) })}
                className="btn-outline px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>

        <div className="h-fit">
          <RecentSalesFeed />
        </div>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 relative overflow-hidden bg-white shadow-xl max-h-[90vh] flex flex-col">
            <button
              className="absolute top-4 right-4 text-ink/50 hover:text-ink transition cursor-pointer"
              onClick={() => setIsFilterOpen(false)}
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-bold text-ink flex items-center gap-2">
              <SlidersHorizontal size={18} /> {t("common.filter")}
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 text-sm space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50 uppercase">{t("shop.game")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" checked={!category} onChange={() => update({ category: undefined })} />
                    <span className="truncate">{t("shop.all")}</span>
                  </label>
                  {(categories ?? []).slice(0, 8).map((c) => (
                    <label key={c.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={category === c.slug}
                        onChange={() => update({ category: c.slug })}
                      />
                      <span className="truncate">{locale === "th" ? c.nameTh : c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50 uppercase">{t("market.rarity")}</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" checked={!rarity} onChange={() => update({ rarity: undefined })} />
                    <span className="truncate">{t("shop.all")}</span>
                  </label>
                  {RARITIES.map((r) => (
                    <label key={r} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="radio" checked={rarity === r} onChange={() => update({ rarity: r })} />
                      <span className="truncate">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50 uppercase">{t("shop.price")}</p>
                <div className="flex items-center gap-2">
                  <input className="input" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <span className="text-ink/40">—</span>
                  <input className="input" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="btn-outline flex-1 cursor-pointer"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  update({ category: undefined, rarity: undefined, minPrice: undefined, maxPrice: undefined });
                  setIsFilterOpen(false);
                }}
              >
                Clear
              </button>
              <button
                className="btn-primary flex-1 cursor-pointer"
                onClick={() => {
                  update({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined });
                  setIsFilterOpen(false);
                }}
              >
                {t("common.apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
