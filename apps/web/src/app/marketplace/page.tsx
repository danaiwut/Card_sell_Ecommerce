"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Star } from "lucide-react";
import { RARITIES, type ListingDto, type Paginated } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatBaht } from "@/lib/format";
import { RecentSalesFeed } from "@/components/recent-sales-feed";

function MarketplaceInner() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const queryString = params.toString();

  const rarity = params.get("rarity") ?? "";
  const category = params.get("category") ?? "";
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<any[]>("/categories"),
  });
  const { data } = useQuery({
    queryKey: ["listings", queryString],
    queryFn: () => api.get<Paginated<ListingDto>>(`/marketplace/listings?${queryString}`),
  });

  const update = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(queryString);
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/marketplace?${sp.toString()}`);
  };

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <input
          placeholder="Search listings..."
          className="input"
          defaultValue={params.get("q") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
          }}
        />
        <Link href="/account/sell" className="btn-gold whitespace-nowrap">
          {t("market.sell")}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <div className="card p-4 text-sm">
            <p className="mb-2 text-xs font-semibold tracking-wider">{t("shop.game")}</p>
            <label className="flex items-center gap-2 py-1">
              <input type="radio" checked={!category} onChange={() => update({ category: undefined })} />
              {t("shop.all")}
            </label>
            {(categories ?? []).slice(0, 8).map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-1">
                <input
                  type="radio"
                  checked={category === c.slug}
                  onChange={() => update({ category: c.slug })}
                />
                {locale === "th" ? c.nameTh : c.name}
              </label>
            ))}

            <p className="mb-2 mt-4 text-xs font-semibold tracking-wider">{t("market.rarity")}</p>
            <label className="flex items-center gap-2 py-1">
              <input type="radio" checked={!rarity} onChange={() => update({ rarity: undefined })} />
              {t("shop.all")}
            </label>
            {RARITIES.map((r) => (
              <label key={r} className="flex items-center gap-2 py-1">
                <input type="radio" checked={rarity === r} onChange={() => update({ rarity: r })} />
                {r}
              </label>
            ))}

            <p className="mb-2 mt-4 text-xs font-semibold tracking-wider">{t("shop.price")}</p>
            <div className="flex gap-2">
              <input className="input" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <input className="input" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <button
              className="btn-primary mt-4 w-full"
              onClick={() => update({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined })}
            >
              {t("common.apply")}
            </button>
          </div>

          <RecentSalesFeed />
        </aside>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
              <tr>
                <th className="px-4 py-3">{t("market.card")}</th>
                <th className="px-4 py-3">{t("market.set")}</th>
                <th className="px-4 py-3">{t("market.rarity")}</th>
                <th className="px-4 py-3">{t("market.seller")}</th>
                <th className="px-4 py-3">{t("market.price")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((l) => (
                <tr key={l.id} className="border-b border-ink/5 hover:bg-cream">
                  <td className="px-4 py-3">
                    <Link href={`/marketplace/${l.catalogItem.id}`} className="font-medium hover:text-gold">
                      {l.catalogItem.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{l.catalogItem.setName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/60">{l.catalogItem.rarity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div>{l.seller.displayName}</div>
                    <div className="flex items-center gap-0.5 text-gold">
                      {Array.from({ length: Math.round(l.seller.rating) }).map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 price">{formatBaht(l.price)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/marketplace/${l.catalogItem.id}`}
                      className="inline-flex rounded-md border border-ink/15 p-2 hover:border-gold"
                    >
                      <ShoppingCart size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <MarketplaceInner />
    </Suspense>
  );
}
