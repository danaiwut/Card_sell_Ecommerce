"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountLayout } from "@/components/account-layout";
import { DevLogin } from "@/components/dev-login";
import { ReviewModal } from "@/components/review-modal";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { TrackingTimeline, type ShipmentEventView } from "@/components/tracking-timeline";
import { api } from "@/lib/api";
import { formatBaht, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import { XCircle } from "lucide-react";

interface OrderItemRow {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  review: { rating: number; comment: string | null; createdAt: string } | null;
  canReview: boolean;
}

interface ShopOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  createdAt: string;
  items: OrderItemRow[];
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    events: ShipmentEventView[];
  } | null;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-sky-100 text-sky-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  REFUNDED: "bg-orange-100 text-orange-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  PROCESSING: "กำลังจัดเตรียม",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ได้รับสินค้า",
  CANCELLED: "ยกเลิกแล้ว",
  REFUNDED: "คืนเงินแล้ว",
};

const CANCELLABLE = ["PENDING", "PAID"];

export default function ShopOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [reviewItem, setReviewItem] = useState<OrderItemRow | null>(null);

  const { data } = useQuery({
    queryKey: ["order-detail", id, session?.userId],
    queryFn: () => api.get<ShopOrderDetail>(`/orders/${id}`, true),
    enabled: Boolean(session),
  });

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; comment?: string }) =>
      api.post(`/orders/${id}/items/${reviewItem!.id}/review`, body, true),
    onSuccess: () => {
      setReviewItem(null);
      qc.invalidateQueries({ queryKey: ["order-detail", id] });
    },
  });

  const cancel = useMutation({
    mutationFn: () => api.del(`/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order-detail", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirmOpen(false);
      router.push("/account/orders");
    },
    onError: (err: any) => setCancelError(err?.message ?? "เกิดข้อผิดพลาด"),
  });

  if (!session) return <DevLogin />;
  if (!data) return <div className="container-page py-10">Loading…</div>;

  const canCancel = CANCELLABLE.includes(data.status);

  useEffect(() => {
    if (searchParams.get("review") !== "1" || !data) return;
    const pending = data.items.find((i) => i.canReview);
    if (pending) setReviewItem(pending);
  }, [searchParams, data]);

  return (
    <>
      <ReviewModal
        open={Boolean(reviewItem)}
        productName={reviewItem?.name ?? ""}
        sellerName="CardVerse"
        variant="product"
        pending={submitReview.isPending}
        onClose={() => setReviewItem(null)}
        onSubmit={(rating, comment) =>
          submitReview.mutate({ rating, comment: comment || undefined })
        }
      />
      <AccountLayout>
          <Link href="/account/orders" className="text-sm text-ink/50 hover:text-ink">
            ← กลับไป My Orders
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">Order Tracking</h1>
              <p className="mt-1 text-sm text-ink/50">
                {data.orderNumber} • {formatDate(data.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[data.status] ?? "bg-ink/10 text-ink/60"}`}>
                {STATUS_LABEL[data.status] ?? data.status}
              </span>
              <ShipmentStatusBadge status={data.shipment?.status} />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <TrackingTimeline
              events={data.shipment?.events ?? []}
              currentStatus={data.shipment?.status ?? "PENDING"}
            />
            <aside className="space-y-4">
              <div className="card p-5">
                <p className="text-xs font-semibold tracking-wider text-ink/50">ORDER SUMMARY</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <SummaryRow label="Order" value={data.orderNumber} />
                  <SummaryRow label="Status" value={STATUS_LABEL[data.status] ?? data.status} />
                  <SummaryRow label="Subtotal" value={formatBaht(data.subtotal)} />
                  <SummaryRow label="Shipping" value={formatBaht(data.shipping)} />
                  <SummaryRow label="Discount" value={formatBaht(data.discount)} />
                  <SummaryRow label="Total" value={formatBaht(data.total)} strong />
                </dl>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold tracking-wider text-ink/50">TRACKING</p>
                <p className="mt-3 text-sm text-ink/60">
                  Carrier: {data.shipment?.carrier ?? "รออัปเดต"}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  Tracking No: {data.shipment?.trackingNumber ?? "รอเลขพัสดุ"}
                </p>
              </div>

              {/* Cancel button (only when order is cancellable) */}
              {canCancel && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                  onClick={() => { setCancelError(""); setConfirmOpen(true); }}
                >
                  <XCircle size={16} /> ยกเลิกคำสั่งซื้อนี้
                </button>
              )}
            </aside>
          </div>

          <div className="card mt-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-ink/5">
                    <td className="px-4 py-3 font-medium">
                      {item.name}
                      {item.review && (
                        <p className="mt-1 text-xs text-ink/50">
                          คุณให้คะแนน {item.review.rating}/5 แล้ว
                        </p>
                      )}
                      {item.canReview && (
                        <button
                          type="button"
                          className="mt-1 block text-xs font-semibold text-gold hover:underline"
                          onClick={() => setReviewItem(item)}
                        >
                          ให้คะแนนสินค้า
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 price">{formatBaht(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccountLayout>

      {/* Cancel confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <XCircle size={28} className="text-red-500" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">ยืนยันการยกเลิก?</h2>
              <p className="mt-2 text-sm text-ink/60">
                คำสั่งซื้อ <span className="font-semibold text-ink">{data.orderNumber}</span>
                <br />
                มูลค่า <span className="font-semibold text-gold">{formatBaht(data.total)}</span>
                <br />
                การยกเลิกไม่สามารถย้อนกลับได้
              </p>
              {cancelError && (
                <p className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{cancelError}</p>
              )}
            </div>
            <div className="flex gap-3 border-t border-ink/10 px-6 py-4">
              <button className="btn-outline flex-1" onClick={() => setConfirmOpen(false)}>
                ไม่ยกเลิก
              </button>
              <button
                className="flex-1 btn bg-red-500 text-white hover:bg-red-600"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink/5 py-1">
      <dt className="text-ink/50">{label}</dt>
      <dd className={strong ? "font-semibold text-gold" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}
