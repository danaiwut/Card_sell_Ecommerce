"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import type { Paginated, ProductDto } from "@cardverse/shared";
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

  const page = parseInt(params.get("page") ?? "1", 10);
  const category = params.get("category") ?? "";
  const type = params.get("type") ?? "";
  const q = params.get("q") ?? "";
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<any[]>("/categories"),
  });

  // Enforce pageSize = 16 for products
  const sp = new URLSearchParams(params.toString());
  if (!sp.has("pageSize")) {
    sp.set("pageSize", "16");
  }
  const queryString = sp.toString();

  const { data, isLoading } = useQuery({
    queryKey: ["shop", queryString],
    queryFn: () => api.get<Paginated<ProductDto>>(`/products?${queryString}`),
  });

  const totalPages = data?.totalPages ?? 1;

  const update = (next: Record<string, string | undefined>) => {
    const freshSp = new URLSearchParams(params.toString());
    // If not explicitly setting page, reset to page 1
    if (!next.hasOwnProperty("page")) {
      freshSp.delete("page");
    }
    for (const [k, v] of Object.entries(next)) {
      if (v) freshSp.set(k, v);
      else freshSp.delete(k);
    }
    router.push(`/shop?${freshSp.toString()}`);
  };

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex items-center gap-3">
        <input
          defaultValue={q}
          placeholder={t("common.search")}
          className="input h-11"
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
      </div>

      <div>
        {isLoading ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {(data?.items ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
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
          </>
        )}
      </div>

      {/* Filter Pop-up Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card w-full max-w-md p-6 relative overflow-hidden bg-white shadow-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
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
              {/* Game Category */}
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50 uppercase">{t("shop.game")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={!category}
                      onChange={() => update({ category: undefined })}
                    />
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

              {/* Product Type */}
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50 uppercase">{t("shop.type")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((ty) => (
                    <label key={ty.value} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={type === ty.value}
                        onChange={() => update({ type: type === ty.value ? undefined : ty.value })}
                      />
                      <span className="truncate">{ty.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50 uppercase">{t("shop.price")}</p>
                <div className="flex items-center gap-2">
                  <input
                    className="input"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-ink/40">—</span>
                  <input
                    className="input"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="btn-outline flex-1 cursor-pointer"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  update({ category: undefined, type: undefined, minPrice: undefined, maxPrice: undefined });
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <ShopInner />
    </Suspense>
  );
}

