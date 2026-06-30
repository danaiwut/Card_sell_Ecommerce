"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountSidebar } from "@/components/account-sidebar";
import { DevLogin } from "@/components/dev-login";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { TrackingTimeline, type ShipmentEventView } from "@/components/tracking-timeline";
import { api } from "@/lib/api";
import { formatBaht, formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";

interface MarketplacePurchaseDetail {
  id: string;
  status: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  createdAt: string;
  seller: { id: string; displayName: string };
  listing: {
    id: string;
    condition: string;
    catalogItem: {
      id: string;
      name: string;
      setName: string | null;
      rarity: string | null;
    };
  };
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    events: ShipmentEventView[];
  } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PAID_HELD: "รอผู้ขายจัดส่ง (เงินอยู่ใน escrow)",
  SHIPPED: "กำลังจัดส่ง",
  DELIVERED: "จัดส่งสำเร็จ",
  COMPLETED: "เสร็จสมบูรณ์",
  DISPUTED: "มีข้อพิพาท",
  REFUNDED: "คืนเงินแล้ว",
};

export default function MarketplacePurchaseTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { session } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["purchase-detail", id, session?.userId],
    queryFn: () => api.get<MarketplacePurchaseDetail>(`/marketplace/purchases/${id}`, true),
    enabled: Boolean(session),
  });

  const confirm = useMutation({
    mutationFn: () => api.post(`/marketplace/orders/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-detail", id] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });

  const dispute = useMutation({
    mutationFn: () => api.post(`/marketplace/orders/${id}/dispute`, { reason: "ไม่ได้รับสินค้า" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-detail", id] }),
  });

  if (!session) return <DevLogin />;
  if (!data) return <div className="container-page py-10">Loading…</div>;

  const canConfirm = ["SHIPPED", "DELIVERED"].includes(data.status);

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <Link href="/account/purchases" className="text-sm text-ink/50 hover:text-ink">
            ← กลับไป Marketplace Purchases
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">Marketplace Tracking</h1>
              <p className="mt-1 text-sm text-ink/50">
                {data.listing.catalogItem.name} • {formatDate(data.createdAt)}
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
                <p className="text-xs font-semibold tracking-wider text-ink/50">PURCHASE SUMMARY</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <SummaryRow label="Card" value={data.listing.catalogItem.name} />
                  <SummaryRow label="Set" value={data.listing.catalogItem.setName ?? "—"} />
                  <SummaryRow label="Seller" value={data.seller.displayName} />
                  <SummaryRow label="Status" value={STATUS_LABEL[data.status] ?? data.status} />
                  <SummaryRow label="Amount" value={formatBaht(data.amount)} strong />
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
              <div className="grid gap-2">
                {canConfirm && (
                  <button
                    className="btn-primary"
                    disabled={confirm.isPending}
                    onClick={() => confirm.mutate()}
                  >
                    ยืนยันรับสินค้า (ปล่อยเงินให้ผู้ขาย)
                  </button>
                )}
                {!["COMPLETED", "REFUNDED", "DISPUTED"].includes(data.status) && (
                  <button
                    className="btn-outline"
                    disabled={dispute.isPending}
                    onClick={() => dispute.mutate()}
                  >
                    เปิดข้อพิพาท
                  </button>
                )}
              </div>
            </aside>
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
