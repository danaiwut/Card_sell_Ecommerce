"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { SuccessBanner } from "@/components/success-banner";
import { formatBaht, formatDate } from "@/lib/format";

interface MpOrder {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  listing: { catalogItem: { name: string; setName: string | null }; seller: { displayName: string } };
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    events: { status: string; note?: string; at: string }[];
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

export default function PurchasesPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <PurchasesPageInner />
    </Suspense>
  );
}

function PurchasesPageInner() {
  const { session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const successOrderId = searchParams.get("order");
  const isSuccess = searchParams.get("status") === "success";

  const { data } = useQuery({
    queryKey: ["purchases", session?.userId],
    queryFn: () => api.get<MpOrder[]>("/marketplace/purchases", true),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (isSuccess && successOrderId) {
      router.replace(`/account/purchases/${successOrderId}`);
      return;
    }
    if (isSuccess) setShowSuccess(true);
  }, [isSuccess, successOrderId, router]);

  const confirm = useMutation({
    mutationFn: (id: string) => api.post(`/marketplace/orders/${id}/confirm`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      router.push(`/account/purchases/${id}?review=1`);
    },
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <h1 className="font-display text-3xl font-semibold">Marketplace Purchases</h1>
          {showSuccess && (
            <div className="mt-4">
              <SuccessBanner
                message="ซื้อสำเร็จ! เงินอยู่ใน escrow รอผู้ขายจัดส่ง"
                onDismiss={() => setShowSuccess(false)}
              />
            </div>
          )}
          <div className="mt-5 space-y-4">
            {(data ?? []).map((o) => (
              <div key={o.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/account/purchases/${o.id}`} className="font-semibold hover:text-gold">
                      {o.listing.catalogItem.name}
                    </Link>
                    <p className="text-xs text-ink/50">
                      {o.listing.catalogItem.setName} • ผู้ขาย {o.listing.seller.displayName} •{" "}
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <p className="price">{formatBaht(o.amount)}</p>
                </div>
                <p className="mt-2 text-sm text-ink/60">
                  สถานะ: {STATUS_LABEL[o.status] ?? o.status}
                </p>
                {o.shipment?.trackingNumber && (
                  <div className="mt-3 rounded-md bg-ink/[0.03] p-3 text-sm">
                    📦 {o.shipment.carrier} • {o.shipment.trackingNumber}
                    <ol className="mt-2 space-y-1 text-xs text-ink/60">
                      {o.shipment.events.map((e, i) => (
                        <li key={i}>
                          {formatDate(e.at)} — {e.status}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {["SHIPPED", "DELIVERED"].includes(o.status) && (
                  <button
                    className="btn-primary mt-3"
                    disabled={confirm.isPending}
                    onClick={() => confirm.mutate(o.id)}
                  >
                    ยืนยันรับสินค้า (ปล่อยเงินให้ผู้ขาย)
                  </button>
                )}
                <Link href={`/account/purchases/${o.id}`} className="btn-outline mt-3">
                  ดู tracking
                </Link>
              </div>
            ))}
            {(data?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ยังไม่มีรายการซื้อ</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
