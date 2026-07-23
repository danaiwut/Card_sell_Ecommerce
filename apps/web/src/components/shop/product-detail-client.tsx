"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import type { ProductDto, ProductReviewDto } from "@cardverse/shared";
import { api } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/query/keys";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatBaht } from "@/lib/format";
import { Breadcrumbs, StarRating } from "@/components/ui/shop-ui";
import { ProductCard } from "@/components/shop/product-card";

export interface ProductDetailPayload {
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

interface Props {
  slug: string;
  initialData: ProductDetailPayload;
}

export function ProductDetailClient({ slug, initialData }: Props) {
  const { t } = useI18n();
  const { session, isLoaded } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "faqs">("details");
  const [cartError, setCartError] = useState<string | null>(null);

  const { data = initialData } = useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => api.get<ProductDetailPayload>(`/products/${slug}`),
    initialData,
    staleTime: 60_000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: queryKeys.productReviews(slug),
    queryFn: () => api.get<ProductReviewDto[]>(`/products/${slug}/reviews`),
    staleTime: 60_000,
  });

  const addToCart = useMutation({
    mutationFn: () =>
      api.post("/cart/items", { productId: data.product.id, quantity: qty }),
    onSuccess: () => {
      setCartError(null);
      qc.invalidateQueries({ queryKey: ["cart"] });
      router.push("/cart");
    },
    onError: (err) => {
      setCartError(err instanceof Error ? err.message : "ไม่สามารถเพิ่มลงตะกร้าได้");
    },
  });

  const { product } = data;
  const gallery = product.images.length ? product.images : [product.imageUrl ?? ""];
  const category = product.catalogItem?.category;

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(category ? [{ label: category.name, href: `/shop?category=${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex gap-4">
          {gallery.length > 1 && (
            <div className="hidden flex-col gap-3 sm:flex">
              {gallery.slice(0, 3).map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-24 w-20 overflow-hidden rounded-[12px] bg-surface ${
                    i === activeImg ? "ring-2 ring-black" : ""
                  }`}
                >
                  {src && <Image src={src} alt="" fill className="object-contain p-1" />}
                </button>
              ))}
            </div>
          )}
          <div className="relative aspect-square flex-1 overflow-hidden rounded-[20px] bg-surface">
            {gallery[activeImg] && (
              <Image src={gallery[activeImg]} alt={product.name} fill className="object-contain p-6" priority />
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-[32px] font-black uppercase leading-tight sm:text-[40px]">{product.name}</h1>
          <div className="mt-3">
            {product.rating != null && (product.reviewCount ?? 0) > 0 ? (
              <StarRating rating={product.rating} />
            ) : (
              <p className="text-sm text-black/40">ยังไม่มีรีวิว</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[32px] font-bold">{formatBaht(product.price)}</span>
            {product.isPreOrder && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                Pre-order
              </span>
            )}
          </div>

          {data.description && (
            <p className="mt-4 text-sm leading-relaxed text-black/60">{data.description}</p>
          )}

          {product.catalogItem?.setName && (
            <div className="mt-6">
              <p className="text-sm font-medium text-black/50">Set</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-black/10 bg-surface px-4 py-2 text-sm">
                  {product.catalogItem.setName}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm font-medium text-black/50">Type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-black/10 bg-black px-4 py-2 text-sm text-white">
                {PRODUCT_TYPE_LABEL[product.type] ?? product.type}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-black/10 bg-surface px-2 py-1">
              <button type="button" className="rounded-full p-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button type="button" className="rounded-full p-2" onClick={() => setQty((q) => q + 1)}>
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              className="btn-primary flex-1 sm:flex-none sm:px-12"
              disabled={!product.stock || addToCart.isPending || !isLoaded}
              onClick={() => {
                if (!isLoaded) return;
                if (!session) {
                  router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
                  return;
                }
                addToCart.mutate();
              }}
            >
              <ShoppingCart size={18} />
              {addToCart.isPending ? "Adding…" : t("common.addToCart")}
            </button>
          </div>
          {cartError && <p className="mt-2 text-sm text-red-600">{cartError}</p>}
          <p className="mt-3 text-sm text-black/40">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16 border-b border-black/10">
        <div className="flex gap-8">
          {(["details", "reviews", "faqs"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-4 text-sm font-medium capitalize ${
                activeTab === tab ? "border-black text-black" : "border-transparent text-black/40"
              }`}
            >
              {tab === "details" ? "Product Details" : tab === "reviews" ? "Rating & Reviews" : "FAQs"}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8">
        {activeTab === "details" && (
          <div className="max-w-2xl space-y-4 text-sm text-black/60">
            <p><strong className="text-black">Type:</strong> {PRODUCT_TYPE_LABEL[product.type] ?? product.type}</p>
            {product.rarity && <p><strong className="text-black">Rarity:</strong> {product.rarity}</p>}
            {product.catalogItem?.brandName && (
              <p><strong className="text-black">Brand:</strong> {product.catalogItem.brandName}</p>
            )}
            {data.description && <p>{data.description}</p>}
          </div>
        )}
        {activeTab === "reviews" && (
          <div>
            {reviews.length === 0 ? (
              <p className="text-sm text-black/50">ยังไม่มีรีวิวจากผู้ซื้อที่ได้รับสินค้าแล้ว</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-[20px] border border-black/10 p-6">
                    <StarRating rating={r.rating} />
                    <p className="mt-3 font-bold">
                      {r.author.displayName}{" "}
                      <span className="text-xs font-normal text-green-600">✓ Verified Purchase</span>
                    </p>
                    {r.comment && (
                      <p className="mt-2 text-sm text-black/60">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "faqs" && (
          <div className="max-w-2xl space-y-4 text-sm text-black/60">
            <p><strong className="text-black">Is this authentic?</strong> All products are verified sealed &amp; authentic.</p>
            <p><strong className="text-black">Shipping?</strong> Ships within 1-3 business days via Flash Express.</p>
          </div>
        )}
      </div>

      {data.related.length > 0 && (
        <section className="border-t border-black/10 py-14">
          <h2 className="text-center text-[32px] font-black uppercase sm:text-[48px]">You might also like</h2>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {data.related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
