"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RARITIES, type CatalogItemDto, type Paginated } from "@cardverse/shared";
import { api } from "@/lib/api";

export interface CatalogOptions {
  categories: { id: string; slug: string; name: string; nameTh: string }[];
  subcategories: { id: string; categoryId: string; slug: string; name: string }[];
  brands: { id: string; categoryId: string | null; slug: string; name: string }[];
  sets: { id: string; slug: string; name: string; releaseDate: string | null }[];
}

export function CatalogItemPicker({
  value,
  onChange,
}: {
  value: CatalogItemDto | null;
  onChange: (item: CatalogItemDto | null) => void;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"search" | "create">("search");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    categoryId: "",
    subcategoryId: "",
    brandId: "",
    setId: "",
    rarity: "",
    cardNumber: "",
    imageUrl: "",
  });

  const { data: options } = useQuery({
    queryKey: ["admin-catalog-options"],
    queryFn: () => api.get<CatalogOptions>("/admin/catalog-options", true),
  });

  const { data: results } = useQuery({
    queryKey: ["admin-catalog-search", q],
    queryFn: () => api.get<Paginated<CatalogItemDto>>(`/catalog-items?q=${encodeURIComponent(q)}`),
    enabled: mode === "search" && q.length >= 2,
  });

  const filteredSubcategories = useMemo(
    () => (options?.subcategories ?? []).filter((s) => s.categoryId === draft.categoryId),
    [options?.subcategories, draft.categoryId],
  );
  const filteredBrands = useMemo(
    () =>
      (options?.brands ?? []).filter((b) => !b.categoryId || b.categoryId === draft.categoryId),
    [options?.brands, draft.categoryId],
  );

  const create = useMutation({
    mutationFn: () =>
      api.post<CatalogItemDto>(
        "/admin/catalog-items",
        {
          name: draft.name,
          categoryId: draft.categoryId,
          subcategoryId: draft.subcategoryId || undefined,
          brandId: draft.brandId || undefined,
          setId: draft.setId || undefined,
          rarity: draft.rarity || undefined,
          cardNumber: draft.cardNumber || undefined,
          imageUrl: draft.imageUrl || undefined,
        },
        true,
      ),
    onSuccess: (item) => {
      onChange(item);
      setMode("search");
      setQ(item.name);
      qc.invalidateQueries({ queryKey: ["admin-catalog-search"] });
    },
  });

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-ink/50">CATALOG ITEM</p>
        <div className="flex rounded-md bg-ink/[0.04] p-1 text-xs">
          <button
            type="button"
            className={`rounded px-2 py-1 ${mode === "search" ? "bg-white shadow-sm" : "text-ink/50"}`}
            onClick={() => setMode("search")}
          >
            Select
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${mode === "create" ? "bg-white shadow-sm" : "text-ink/50"}`}
            onClick={() => setMode("create")}
          >
            Create
          </button>
        </div>
      </div>

      {value && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-gold/10 px-3 py-2 text-sm">
          <span>
            {value.name} <span className="text-ink/50">({value.setName ?? value.category.name})</span>
          </span>
          <button type="button" className="text-xs font-semibold text-gold" onClick={() => onChange(null)}>
            Clear
          </button>
        </div>
      )}

      {mode === "search" ? (
        <div className="relative mt-3">
          <input
            className="input"
            placeholder="ค้นหา catalog item..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
          {(results?.items.length ?? 0) > 0 && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-ink/10 bg-white shadow-card">
              {results!.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-cream"
                  onClick={() => {
                    onChange(item);
                    setQ(item.name);
                  }}
                >
                  <span>{item.name}</span>
                  <span className="shrink-0 text-xs text-ink/50">
                    {item.setName ?? item.category.name} • {item.rarity ?? "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="input sm:col-span-2"
            placeholder="ชื่อการ์ด / catalog item"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <select
            className="input"
            value={draft.categoryId}
            onChange={(event) =>
              setDraft({ ...draft, categoryId: event.target.value, subcategoryId: "", brandId: "" })
            }
          >
            <option value="">เลือกหมวดหมู่</option>
            {(options?.categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={draft.subcategoryId}
            onChange={(event) => setDraft({ ...draft, subcategoryId: event.target.value })}
          >
            <option value="">Subcategory</option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={draft.brandId}
            onChange={(event) => setDraft({ ...draft, brandId: event.target.value })}
          >
            <option value="">Brand</option>
            {filteredBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={draft.setId}
            onChange={(event) => setDraft({ ...draft, setId: event.target.value })}
          >
            <option value="">Set</option>
            {(options?.sets ?? []).map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={draft.rarity}
            onChange={(event) => setDraft({ ...draft, rarity: event.target.value })}
          >
            <option value="">Rarity</option>
            {RARITIES.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Card number"
            value={draft.cardNumber}
            onChange={(event) => setDraft({ ...draft, cardNumber: event.target.value })}
          />
          <input
            className="input sm:col-span-2"
            placeholder="Catalog image URL"
            value={draft.imageUrl}
            onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
          />
          <button
            type="button"
            className="btn-gold sm:col-span-2"
            disabled={!draft.name || !draft.categoryId || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "กำลังสร้าง..." : "สร้าง catalog item แล้วเลือกใช้"}
          </button>
        </div>
      )}
    </div>
  );
}
