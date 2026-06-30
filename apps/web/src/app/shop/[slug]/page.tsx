"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Handshake,
  Heart,
  Info,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatBaht, formatDate } from "@/lib/format";
import {
  DetailBreadcrumb,
  RarityRibbon,
  RelatedCatalogCard,
  RelatedSectionHeader,
  SpecTile,
  TrustBadges,
  VerifiedBadge,
} from "@/components/detail-layout";

interface DetailPayload {
  product: ProductDto;
  releaseDate: string | null;
  description: string | null;
  related: ProductDto[];
}

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  BOOSTER_BOX: "Booster Box",
  DECK: "Deck",
  SINGLE_CARD: "Single Card",
  ACCESSORY: "Accessory",
};

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
  const category = product.catalogItem?.category;
  const ribbonLabel = product.isPreOrder
    ? "PRE-ORDER"
    : product.rarity ?? (product.stock > 0 ? "IN STOCK" : "SOLD OUT");

  return (
    <div className="container-page py-8">
      <DetailBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(category
            ? [{ label: category.name, href: `/shop?category=${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left — media + quick specs */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-ink/5 ring-1 ring-ink/10">
            {gallery[activeImg] && (
              <Image
                src={gallery[activeImg]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            )}
            {ribbonLabel && <RarityRibbon label={ribbonLabel} />}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-ink/10 bg-white/95 px-3 py-2 text-[11px] font-semibold text-ink shadow-card">
              <BadgeCheck size={14} className="text-gold" />
              SEALED &amp; AUTHENTIC
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2">
              {gallery.slice(0, 4).map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-16 w-16 overflow-hidden rounded-md ring-1 ring-ink/10 ${
                    i === activeImg ? "ring-2 ring-gold" : ""
                  }`}
                >
                  {src && <Image src={src} alt="" fill className="object-cover" />}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SpecTile label="SET" value={product.catalogItem?.setName ?? product.subtitle ?? "—"} />
            <SpecTile label="TYPE" value={PRODUCT_TYPE_LABEL[product.type] ?? product.type} />
            <SpecTile
              label="STOCK"
              value={product.stock > 0 ? `${product.stock} units` : "Out of stock"}
            />
            <SpecTile
              label="RELEASE"
              value={data.releaseDate ? formatDate(data.releaseDate) : "—"}
            />
          </div>
        </div>

        {/* Right — info + actions */}
        <div>
          <VerifiedBadge />
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">{product.name}</h1>
          {product.subtitle && (
            <p className="mt-1 text-sm text-ink/50">{product.subtitle}</p>
          )}

          <div className="card mt-6 p-5">
            <p className="text-xs font-semibold tracking-wider text-ink/50">CURRENT PRICE</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 pb-4">
              <p className="text-3xl price">{formatBaht(product.price)}</p>
              <div className="text-right text-sm text-ink/60">
                {product.stock > 0 ? (
                  <span className="font-medium text-ink">{product.stock} in stock</span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </div>
            </div>
            {product.isPreOrder && (
              <p className="mt-3 text-xs font-semibold tracking-wide text-gold">PRE-ORDER AVAILABLE</p>
            )}
          </div>

          {data.description && (
            <div className="card mt-5 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Info size={16} className="text-gold" />
                Product Notes
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{data.description}</p>
            </div>
          )}

          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm text-ink/60">Quantity</span>
            <div className="flex items-center rounded-md border border-ink/15 bg-white">
              <button
                type="button"
                className="px-2.5 py-2"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button type="button" className="px-2.5 py-2" onClick={() => setQty((q) => q + 1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!product.stock || addToCart.isPending}
              onClick={() => {
                if (!session) return router.push("/account");
                addToCart.mutate();
              }}
            >
              <ShoppingCart size={16} />
              {t("common.addToCart")}
            </button>
            <button type="button" className="btn-outline flex-1">
              <Handshake size={16} />
              Make an Offer
            </button>
            <button type="button" className="btn-outline sm:w-auto">
              <Heart size={16} />
              <span className="sr-only">{t("common.wishlist")}</span>
            </button>
          </div>

          <TrustBadges />
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-16 border-t border-ink/10 pt-12">
          <RelatedSectionHeader
            title="Related Products"
            subtitle={
              category
                ? `Curated selections from ${category.name}.`
                : "You may also like these items."
            }
            href={category ? `/shop?category=${category.slug}` : "/shop"}
            linkLabel="View All"
          />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {data.related.slice(0, 4).map((p) => (
              <RelatedCatalogCard
                key={p.id}
                href={`/shop/${p.slug}`}
                name={p.name}
                imageUrl={p.imageUrl}
                meta={`${PRODUCT_TYPE_LABEL[p.type] ?? p.type}${p.rarity ? ` · ${p.rarity}` : ""}`}
                price={formatBaht(p.price)}
                badge={p.rarity ?? undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
