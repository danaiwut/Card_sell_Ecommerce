"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Minus, Plus, Trash2, ShieldCheck } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isClerkEnabled } from "@/lib/clerk-config";
import { formatBaht } from "@/lib/format";
import { CheckoutModal } from "@/components/checkout-modal";

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
  const { t } = useI18n();
  const { session } = useSession();
  const searchParams = useSearchParams();
  const [showCancelled, setShowCancelled] = useState(false);
  const qc = useQueryClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("status") === "cancelled") setShowCancelled(true);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["cart", session?.userId],
    queryFn: () => api.get<CartPayload>("/cart", true),
    enabled: Boolean(session),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["cart-count"] });
  };

  const setQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch(`/cart/items/${id}`, { quantity }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/cart/items/${id}`),
    onSuccess: invalidate,
  });

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">กรุณาเข้าสู่ระบบเพื่อดูตะกร้า</p>
        <Link href={isClerkEnabled() ? "/sign-in" : "/account"} className="btn-primary mt-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="page-title">{t("cart.title")}</h1>
      {showCancelled && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ยกเลิกการชำระเงินแล้ว — สินค้ายังอยู่ในตะกร้า
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setShowCancelled(false)}
          >
            ปิด
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="space-y-3 md:hidden">
            {(data?.items ?? []).map((line) => (
              <div key={line.id} className="card p-4">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-ink/5">
                    {line.product.imageUrl && (
                      <Image src={line.product.imageUrl} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{line.product.name}</p>
                    <p className="text-xs text-ink/50">{line.product.subtitle}</p>
                    <p className="mt-1 price text-sm">{formatBaht(line.product.price)}</p>
                  </div>
                  <button className="text-red-500" onClick={() => remove.mutate(line.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-ink/15">
                    <button className="px-2 py-1" onClick={() => setQty.mutate({ id: line.id, quantity: line.quantity - 1 })}>
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button className="px-2 py-1" onClick={() => setQty.mutate({ id: line.id, quantity: line.quantity + 1 })}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="price font-semibold">{formatBaht(line.lineTotal)}</span>
                </div>
              </div>
            ))}
            {!isLoading && (data?.items.length ?? 0) === 0 && (
              <div className="card p-8 text-center text-sm text-ink/40">ตะกร้าว่างเปล่า</div>
            )}
            <Link href="/shop" className="btn-outline inline-flex">
              <ChevronLeft size={16} /> {t("cart.continue")}
            </Link>
          </div>

          <div className="card hidden overflow-hidden md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
              <tr>
                <th className="px-4 py-3">PRODUCT</th>
                <th className="px-4 py-3">PRICE</th>
                <th className="px-4 py-3">QTY</th>
                <th className="px-4 py-3">TOTAL</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((line) => (
                <tr key={line.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded bg-ink/5">
                        {line.product.imageUrl && (
                          <Image src={line.product.imageUrl} alt="" fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{line.product.name}</p>
                        <p className="text-xs text-ink/50">{line.product.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 price">{formatBaht(line.product.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex w-fit items-center rounded-md border border-ink/15">
                      <button className="px-2 py-1" onClick={() => setQty.mutate({ id: line.id, quantity: line.quantity - 1 })}>
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center">{line.quantity}</span>
                      <button className="px-2 py-1" onClick={() => setQty.mutate({ id: line.id, quantity: line.quantity + 1 })}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 price">{formatBaht(line.lineTotal)}</td>
                  <td className="px-4 py-3">
                    <button className="text-red-500" onClick={() => remove.mutate(line.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink/40">
                    ตะกร้าว่างเปล่า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Link href="/shop" className="btn-outline">
              <ChevronLeft size={16} /> {t("cart.continue")}
            </Link>
          </div>
          </div>
        </div>

        <div className="card h-fit p-5">
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">{t("cart.subtotal")}</span>
            <span className="price">{formatBaht(data?.subtotal ?? 0)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink/60">{t("cart.shipping")}</span>
            <span className="price">{formatBaht(data?.shipping ?? 0)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-semibold">
            <span>{t("cart.total")}</span>
            <span className="price">{formatBaht(data?.total ?? 0)}</span>
          </div>
          <button
            className="btn-primary mt-4 w-full"
            disabled={(data?.items.length ?? 0) === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <ShieldCheck size={16} /> {t("cart.checkout")}
          </button>
          <p className="mt-2 text-center text-xs text-ink/40">🔒 ปลอดภัยด้วย SSL</p>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={data}
      />
    </div>
  );
}
