"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Minus, Plus, Trash2, ShieldCheck } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatBaht } from "@/lib/format";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCancelled, setShowCancelled] = useState(false);
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchParams.get("status") === "cancelled") setShowCancelled(true);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["cart", session?.userId],
    queryFn: () => api.get<CartPayload>("/cart", true),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (data?.items) {
      setSelectedIds(new Set(data.items.map((i) => i.id)));
    }
  }, [data?.items]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  const setQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch(`/cart/items/${id}`, { quantity }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/cart/items/${id}`),
    onSuccess: (_, id) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      invalidate();
    },
  });

  const selectedItems = useMemo(
    () => (data?.items ?? []).filter((line) => selectedIds.has(line.id)),
    [data?.items, selectedIds],
  );
  const selectedSubtotal = selectedItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const allSelected = (data?.items.length ?? 0) > 0 && selectedIds.size === data!.items.length;

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!data?.items.length) return;
    setSelectedIds(allSelected ? new Set() : new Set(data.items.map((i) => i.id)));
  }

  function goCheckout() {
    const ids = selectedItems.map((i) => i.id);
    if (ids.length === 0) return;
    router.push(`/checkout?items=${ids.join(",")}`);
  }

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">กรุณาเข้าสู่ระบบเพื่อดูตะกร้า</p>
        <Link href="/sign-in" className="btn-primary mt-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  function ProductCell({ line }: { line: CartPayload["items"][number] }) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={`/shop/${line.product.slug}`}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-ink/5 ring-1 ring-ink/10 transition hover:ring-gold/40 md:h-12 md:w-12"
        >
          {line.product.imageUrl && (
            <Image src={line.product.imageUrl} alt="" fill className="object-cover" />
          )}
        </Link>
        <div className="min-w-0">
          <Link
            href={`/shop/${line.product.slug}`}
            className="font-medium hover:text-gold hover:underline"
          >
            {line.product.name}
          </Link>
          {line.product.subtitle && (
            <p className="text-xs text-ink/50">{line.product.subtitle}</p>
          )}
        </div>
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
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-gold"
                    checked={selectedIds.has(line.id)}
                    onChange={() => toggleItem(line.id)}
                    aria-label={`เลือก ${line.product.name}`}
                  />
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-ink/5">
                    <Link href={`/shop/${line.product.slug}`}>
                      {line.product.imageUrl && (
                        <Image src={line.product.imageUrl} alt="" fill className="object-cover" />
                      )}
                    </Link>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/shop/${line.product.slug}`}
                      className="font-medium hover:text-gold hover:underline"
                    >
                      {line.product.name}
                    </Link>
                    <p className="text-xs text-ink/50">{line.product.subtitle}</p>
                    <p className="mt-1 price text-sm">{formatBaht(line.product.price)}</p>
                  </div>
                  <button className="text-red-500" onClick={() => remove.mutate(line.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between pl-7">
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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="เลือกทั้งหมด"
                  />
                </th>
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
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-gold"
                      checked={selectedIds.has(line.id)}
                      onChange={() => toggleItem(line.id)}
                      aria-label={`เลือก ${line.product.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ProductCell line={line} />
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
                  <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
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
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
            เลือกแล้ว {selectedItems.length} รายการ
          </p>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-ink/60">{t("cart.subtotal")}</span>
            <span className="price">{formatBaht(selectedSubtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink/60">{t("cart.shipping")}</span>
            <span className="price">{formatBaht(0)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-semibold">
            <span>{t("cart.total")}</span>
            <span className="price">{formatBaht(selectedSubtotal)}</span>
          </div>
          <button
            className="btn-primary mt-4 w-full"
            disabled={selectedItems.length === 0}
            onClick={goCheckout}
          >
            <ShieldCheck size={16} /> {t("cart.checkout")}
          </button>
          <p className="mt-2 text-center text-xs text-ink/40">🔒 ปลอดภัยด้วย SSL</p>
        </div>
      </div>
    </div>
  );
}
