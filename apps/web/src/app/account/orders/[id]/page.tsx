"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AccountSidebar } from "@/components/account-sidebar";
import { DevLogin } from "@/components/dev-login";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { TrackingTimeline, type ShipmentEventView } from "@/components/tracking-timeline";
import { api } from "@/lib/api";
import { formatBaht, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";

interface ShopOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  createdAt: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    events: ShipmentEventView[];
  } | null;
}

export default function ShopOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { session } = useSession();
  const { data } = useQuery({
    queryKey: ["order-detail", id, session?.userId],
    queryFn: () => api.get<ShopOrderDetail>(`/orders/${id}`, true),
    enabled: Boolean(session),
  });

  if (!session) return <DevLogin />;
  if (!data) return <div className="container-page py-10">Loading…</div>;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
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
            <ShipmentStatusBadge status={data.shipment?.status} />
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
                  <SummaryRow label="Status" value={data.status} />
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
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b border-ink/5">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 price">{formatBaht(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
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
