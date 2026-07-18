"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PRODUCT_TYPES,
  RARITIES,
  type CatalogItemDto,
  type ProductType,
  type Rarity,
} from "@cardverse/shared";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { CatalogItemPicker } from "./catalog-item-picker";

const INITIAL_FORM = {
  name: "",
  subtitle: "",
  description: "",
  price: "",
  stock: "10",
  type: "SINGLE_CARD" as ProductType,
  rarity: "" as Rarity | "",
  imageUrl: "",
  images: "",
  isPreOrder: false,
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
};

export function AdminProductForm({ onCreated }: { onCreated?: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [catalogItem, setCatalogItem] = useState<CatalogItemDto | null>(null);
  const [uploading, setUploading] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      api.post(
        "/admin/products",
        {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          rarity: form.rarity || undefined,
          catalogItemId: catalogItem?.id,
          images: (form.images ?? "")
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        },
        true,
      ),
    onSuccess: () => {
      setForm(INITIAL_FORM);
      setCatalogItem(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      onCreated?.();
    },
  });

  return (
    <div className="card h-fit p-4">
      <p className="text-sm font-semibold">เพิ่มสินค้าใหม่</p>
      <p className="mt-1 text-xs text-ink/50">
        กรอกข้อมูลที่ใช้บน shop detail และผูกกับ catalog เพื่อให้ marketplace/price chart ใช้ข้อมูลเดียวกัน
      </p>

      <div className="mt-4 grid gap-3">
        <input
          className="input"
          placeholder="ชื่อสินค้า"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          className="input"
          placeholder="Subtitle / คำโปรย"
          value={form.subtitle}
          onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
        />
        <textarea
          className="input min-h-24"
          placeholder="รายละเอียดสินค้า"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="ราคา"
            type="number"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
          />
          <input
            className="input"
            placeholder="สต็อก"
            type="number"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="input"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as ProductType })}
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={form.rarity}
            onChange={(event) => setForm({ ...form, rarity: event.target.value as Rarity | "" })}
          >
            <option value="">Rarity</option>
            {RARITIES.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        <CatalogItemPicker value={catalogItem} onChange={setCatalogItem} />

        <input
          className="input"
          placeholder="Image URL (หรือ upload ด้านล่าง)"
          value={form.imageUrl}
          onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
        />
        <label className="text-xs font-semibold tracking-wider text-ink/50">
          Upload image
          <input
            className="input mt-1"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const imageUrl = await uploadImage(file, "products");
                setForm((current) => ({ ...current, imageUrl }));
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        {uploading && <p className="text-xs text-ink/50">กำลังอัปโหลดรูป...</p>}
        {form.imageUrl && <p className="truncate text-xs text-green-700">รูปพร้อมใช้: {form.imageUrl}</p>}

        <textarea
          className="input min-h-20"
          placeholder="รูปเพิ่มเติม: 1 URL ต่อ 1 บรรทัด"
          value={form.images}
          onChange={(event) => setForm({ ...form, images: event.target.value })}
        />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Toggle label="Pre-order" checked={form.isPreOrder} onChange={(value) => setForm({ ...form, isPreOrder: value })} />
          <Toggle label="Featured" checked={form.isFeatured} onChange={(value) => setForm({ ...form, isFeatured: value })} />
          <Toggle label="Trending" checked={form.isTrending} onChange={(value) => setForm({ ...form, isTrending: value })} />
          <Toggle label="New Arrival" checked={form.isNewArrival} onChange={(value) => setForm({ ...form, isNewArrival: value })} />
        </div>

        <button
          type="button"
          className="btn-primary w-full"
          disabled={!form.name || !form.price || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "กำลังเพิ่มสินค้า..." : "เพิ่มสินค้า"}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
