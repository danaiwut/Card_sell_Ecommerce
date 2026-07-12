"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { formatBaht, formatDate } from "@/lib/format";
import { XCircle, PackageSearch, ChevronRight } from "lucide-react";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    events: { status: string; note?: string; at: string }[];
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

function CancelDialog({
  order,
  onClose,
  onConfirm,
  isPending,
  error,
}: {
  order: OrderRow;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
            <XCircle size={24} className="text-red-500" />
          </div>
          <h2 className="mt-4 text-center font-display text-xl font-semibold">ยืนยันการยกเลิก?</h2>
          <p className="mt-2 text-center text-sm text-ink/60">
            คำสั่งซื้อ <span className="font-semibold text-ink">{order.orderNumber}</span>
            <br />
            การยกเลิกไม่สามารถย้อนกลับได้
          </p>

          <div className="mt-4 rounded-xl border border-ink/10 bg-ink/2 p-4 space-y-1">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink/70">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatBaht(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink/10 pt-2 mt-2 font-semibold text-sm">
              <span>ยอดรวม</span>
              <span className="text-gold">{formatBaht(order.total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        <div className="flex gap-3 border-t border-ink/10 px-6 py-4">
          <button className="btn-outline flex-1" onClick={onClose}>
            ไม่ยกเลิก
          </button>
          <button
            className="flex-1 btn bg-red-500 text-white hover:bg-red-600"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);
  const [cancelError, setCancelError] = useState("");

  const { data } = useQuery({
    queryKey: ["orders", session?.userId],
    queryFn: () => api.get<OrderRow[]>("/orders", true),
    enabled: Boolean(session),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.del(`/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setCancelTarget(null);
      setCancelError("");
    },
    onError: (err: any) => setCancelError(err?.message ?? "เกิดข้อผิดพลาด"),
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <h1 className="font-display text-3xl font-semibold">My Orders</h1>

          <div className="mt-5 space-y-4">
            {(data ?? []).length === 0 && (
              <div className="card flex flex-col items-center gap-4 py-16 text-center">
                <PackageSearch size={40} className="text-ink/20" />
                <p className="text-sm text-ink/40">ยังไม่มีคำสั่งซื้อ</p>
              </div>
            )}

            {(data ?? []).map((o) => (
              <div key={o.id} className={`card p-5 transition ${o.status === "CANCELLED" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/account/orders/${o.id}`} className="font-semibold hover:text-gold transition">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-ink/50">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="price">{formatBaht(o.total)}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[o.status] ?? "bg-ink/10 text-ink/60"}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                </div>

                <ul className="mt-3 space-y-0.5 text-sm text-ink/70">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="text-ink/30">•</span> {i.name} × {i.quantity}
                    </li>
                  ))}
                </ul>

                {o.shipment?.trackingNumber && (
                  <div className="mt-3 rounded-xl bg-ink/3 px-4 py-3 text-sm">
                    <p className="font-medium">
                      📦 {o.shipment.carrier} · {o.shipment.trackingNumber}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/account/orders/${o.id}`} className="btn-outline flex items-center gap-1">
                    ดูรายละเอียด <ChevronRight size={14} />
                  </Link>
                  {CANCELLABLE.includes(o.status) && (
                    <button
                      className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition"
                      onClick={() => { setCancelError(""); setCancelTarget(o); }}
                    >
                      <XCircle size={14} /> ยกเลิกคำสั่งซื้อ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cancelTarget && (
        <CancelDialog
          order={cancelTarget}
          onClose={() => { setCancelTarget(null); setCancelError(""); }}
          onConfirm={() => cancel.mutate(cancelTarget.id)}
          isPending={cancel.isPending}
          error={cancelError}
        />
      )}
    </div>
  );
}
