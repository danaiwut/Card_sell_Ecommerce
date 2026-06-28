"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import type { Paginated, ProductDto, PRODUCT_TYPES } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/product-card";

const TYPES: { value: string; label: string }[] = [
  { value: "BOOSTER_BOX", label: "Booster Box" },
  { value: "DECK", label: "Deck" },
  { value: "SINGLE_CARD", label: "Single Card" },
  { value: "ACCESSORY", label: "Accessories" },
];

function ShopInner() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get("category") ?? "";
  const type = params.get("type") ?? "";
  const q = params.get("q") ?? "";
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<any[]>("/categories"),
  });

  const queryString = params.toString();
  const { data, isLoading } = useQuery({
    queryKey: ["shop", queryString],
    queryFn: () => api.get<Paginated<ProductDto>>(`/products?${queryString}`),
  });

  const update = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(queryString);
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/shop?${sp.toString()}`);
  };

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex items-center gap-3">
        <input
          defaultValue={q}
          placeholder={t("common.search")}
          className="input"
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
          }}
        />
        <button className="btn-outline whitespace-nowrap">
          <SlidersHorizontal size={16} /> {t("common.filter")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        <aside className="card h-fit p-4 text-sm">
          <p className="mb-3 text-xs font-semibold tracking-wider text-ink/50">
            {t("common.filter")}
          </p>

          <p className="mb-2 text-xs font-semibold tracking-wider">{t("shop.game")}</p>
          <label className="flex items-center gap-2 py-1">
            <input
              type="radio"
              checked={!category}
              onChange={() => update({ category: undefined })}
            />
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

          <p className="mb-2 mt-4 text-xs font-semibold tracking-wider">{t("shop.type")}</p>
          {TYPES.map((ty) => (
            <label key={ty.value} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={type === ty.value}
                onChange={() => update({ type: type === ty.value ? undefined : ty.value })}
              />
              {ty.label}
            </label>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold tracking-wider">{t("shop.price")}</p>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              className="input"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <button
            className="btn-primary mt-4 w-full"
            onClick={() => update({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined })}
          >
            {t("common.apply")}
          </button>
        </aside>

        <div>
          {isLoading ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {(data?.items ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <ShopInner />
    </Suspense>
  );
}
