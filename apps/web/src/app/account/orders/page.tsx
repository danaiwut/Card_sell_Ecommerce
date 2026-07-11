"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { SuccessBanner } from "@/components/success-banner";
import { formatBaht, formatDate } from "@/lib/format";

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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const { session } = useSession();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const successOrder = searchParams.get("order");
  const isSuccess = searchParams.get("status") === "success";

  const { data } = useQuery({
    queryKey: ["orders", session?.userId],
    queryFn: () => api.get<OrderRow[]>("/orders", true),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (isSuccess) setShowSuccess(true);
  }, [isSuccess]);

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <h1 className="font-display text-3xl font-semibold">My Orders</h1>
          {showSuccess && (
            <div className="mt-4">
              <SuccessBanner
                message={
                  successOrder
                    ? `ชำระเงินสำเร็จ! คำสั่งซื้อ ${successOrder} กำลังเตรียมจัดส่ง`
                    : "ชำระเงินสำเร็จ! คำสั่งซื้อของคุณกำลังเตรียมจัดส่ง"
                }
                onDismiss={() => setShowSuccess(false)}
              />
            </div>
          )}
          <div className="mt-5 space-y-4">
            {(data ?? []).map((o) => (
              <div key={o.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/account/orders/${o.id}`} className="font-semibold hover:text-gold">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-ink/50">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="price">{formatBaht(o.total)}</p>
                    <span className="text-xs uppercase tracking-wider text-ink/50">{o.status}</span>
                  </div>
                </div>
                <ul className="mt-3 text-sm text-ink/70">
                  {o.items.map((i, idx) => (
                    <li key={idx}>
                      {i.name} × {i.quantity}
                    </li>
                  ))}
                </ul>
                {o.shipment?.trackingNumber && (
                  <div className="mt-3 rounded-md bg-ink/[0.03] p-3 text-sm">
                    <p className="font-medium">
                      📦 {o.shipment.carrier} • {o.shipment.trackingNumber}
                    </p>
                    <ol className="mt-2 space-y-1 text-xs text-ink/60">
                      {o.shipment.events.map((e, i) => (
                        <li key={i}>
                          {formatDate(e.at)} — {e.status} {e.note ? `(${e.note})` : ""}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <Link href={`/account/orders/${o.id}`} className="btn-outline mt-3">
                  ดู tracking
                </Link>
              </div>
            ))}
            {(data?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ยังไม่มีคำสั่งซื้อ</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
