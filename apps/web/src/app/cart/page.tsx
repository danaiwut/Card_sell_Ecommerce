"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Minus, Plus, Tag, Trash2 } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { formatBaht } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/shop-ui";

interface CartPayload {
  items: { id: string; quantity: number; product: ProductDto; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <CartPageInner />
    </Suspense>
  );
}

function CartPageInner() {
  const { session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCancelled, setShowCancelled] = useState(false);
  const qc = useQueryClient();
  const [promo, setPromo] = useState("");

  useEffect(() => {
    if (searchParams.get("status") === "cancelled") setShowCancelled(true);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["cart", session?.userId],
    queryFn: () => api.get<CartPayload>("/cart", true),
    enabled: Boolean(session),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const setQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch(`/cart/items/${id}`, { quantity }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/cart/items/${id}`),
    onSuccess: invalidate,
  });

  const subtotal = data?.subtotal ?? 0;
  const shipping = data?.shipping ?? 0;
  const total = data?.total ?? subtotal + shipping;

  function goCheckout() {
    if (!data?.items.length) return;
    router.push(`/checkout?items=${data.items.map((i) => i.id).join(",")}`);
  }

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-black/60">กรุณาเข้าสู่ระบบเพื่อดูตะกร้า</p>
        <Link href="/sign-in" className="btn-primary mt-4">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />

      <h1 className="page-title">Your Cart</h1>

      {showCancelled && (
        <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Payment cancelled — items remain in your cart.
          <button type="button" className="ml-2 underline" onClick={() => setShowCancelled(false)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Cart items */}
        <div className="space-y-4">
          {(data?.items ?? []).map((line) => (
            <div
              key={line.id}
              className="flex flex-col gap-4 rounded-[20px] border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="flex gap-4">
                <Link
                  href={`/shop/${line.product.slug}`}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[12px] bg-surface"
                >
                  {line.product.imageUrl && (
                    <Image src={line.product.imageUrl} alt="" fill className="object-contain p-2" />
                  )}
                </Link>
                <div className="min-w-0">
                  <Link
                    href={`/shop/${line.product.slug}`}
                    className="text-lg font-bold hover:underline"
                  >
                    {line.product.name}
                  </Link>
                  {line.product.subtitle && (
                    <p className="mt-1 text-sm text-black/50">Size: {line.product.subtitle}</p>
                  )}
                  <p className="mt-2 text-xl font-bold">{formatBaht(line.product.price)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <button
                  type="button"
                  className="text-red-500"
                  onClick={() => remove.mutate(line.id)}
                  aria-label="Remove"
                >
                  <Trash2 size={20} />
                </button>
                <div className="flex items-center rounded-full border border-black/10 bg-surface px-2 py-1">
                  <button
                    type="button"
                    className="rounded-full p-2"
                    onClick={() => setQty.mutate({ id: line.id, quantity: line.quantity - 1 })}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                  <button
                    type="button"
                    className="rounded-full p-2"
                    onClick={() => setQty.mutate({ id: line.id, quantity: line.quantity + 1 })}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && (data?.items.length ?? 0) === 0 && (
            <div className="rounded-[20px] border border-black/10 py-16 text-center text-black/40">
              Your cart is empty
              <div className="mt-4">
                <Link href="/shop" className="btn-outline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-[20px] border border-black/10 p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold">Order Summary</h2>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-black/50">Subtotal</span>
              <span className="font-medium">{formatBaht(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/50">Delivery Fee</span>
              <span className="font-medium">{formatBaht(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatBaht(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Add promo code"
                className="input w-full pl-10 !rounded-full"
              />
            </div>
            <button type="button" className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white">
              Apply
            </button>
          </div>

          <button
            type="button"
            className="btn-primary mt-6 w-full"
            disabled={!data?.items.length}
            onClick={goCheckout}
          >
            Go to Checkout <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
