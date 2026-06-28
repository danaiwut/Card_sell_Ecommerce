"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Minus, Plus } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ProductCard } from "@/components/product-card";
import { formatBaht, formatDate } from "@/lib/format";

interface DetailPayload {
  product: ProductDto;
  releaseDate: string | null;
  description: string | null;
  related: ProductDto[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useI18n();
  const { session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const { data } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<DetailPayload>(`/products/${slug}`),
  });

  const addToCart = useMutation({
    mutationFn: () =>
      api.post("/cart/items", { productId: data!.product.id, quantity: qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      router.push("/cart");
    },
  });

  if (!data) return <div className="container-page py-10">Loading…</div>;
  const { product } = data;
  const gallery = product.images.length ? product.images : [product.imageUrl ?? ""];

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-ink/5">
            {gallery[activeImg] && (
              <Image src={gallery[activeImg]} alt={product.name} fill className="object-cover" />
            )}
          </div>
          <div className="mt-3 flex gap-3">
            {gallery.slice(0, 4).map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-md ${i === activeImg ? "ring-2 ring-gold" : ""}`}
              >
                {src && <Image src={src} alt="" fill className="object-cover" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold">{product.name}</h1>
          <p className="text-sm text-ink/50">
            {product.catalogItem?.category.name}
            {product.subtitle ? ` / ${product.subtitle}` : ""}
          </p>
          <p className="mt-4 text-2xl price">{formatBaht(product.price)}</p>
          <p className="mt-1 text-sm text-ink/60">
            Stock: {product.stock > 0 ? `${product.stock} In Stock` : "Out of stock"}
          </p>

          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm text-ink/60">Quantity</span>
            <div className="flex items-center rounded-md border border-ink/15">
              <button className="px-2 py-1.5" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button className="px-2 py-1.5" onClick={() => setQty((q) => q + 1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              className="btn-primary flex-1"
              disabled={!product.stock || addToCart.isPending}
              onClick={() => {
                if (!session) return router.push("/account");
                addToCart.mutate();
              }}
            >
              {t("common.addToCart")}
            </button>
            <button className="btn-outline">
              <Heart size={16} /> {t("common.wishlist")}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold tracking-wider text-ink/50">DESCRIPTION</p>
              <p className="mt-2 text-ink/70">{data.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-ink/50">SPECIFICATION</p>
              <dl className="mt-2 space-y-1 text-ink/70">
                <Spec label="Release Date" value={data.releaseDate ? formatDate(data.releaseDate) : "—"} />
                <Spec label="Rarity" value={product.rarity ?? "—"} />
                <Spec label="Card Type" value={product.type} />
              </dl>
            </div>
          </div>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">YOU MAY ALSO LIKE</h2>
          <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-5">
            {data.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 py-1">
      <dt>{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
