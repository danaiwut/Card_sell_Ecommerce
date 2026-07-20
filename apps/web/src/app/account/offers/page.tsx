"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ListingOfferDto } from "@cardverse/shared";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";
import { formatBaht, formatDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอตอบรับ",
  ACCEPTED: "ยอมรับแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
  WITHDRAWN: "ถอนแล้ว",
};

export default function OffersPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"incoming" | "mine">("incoming");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: incoming = [] } = useQuery({
    queryKey: ["offers-incoming", session?.userId],
    queryFn: () => api.get<ListingOfferDto[]>("/marketplace/offers/incoming", true),
    enabled: Boolean(session),
  });

  const { data: mine = [] } = useQuery({
    queryKey: ["offers-mine", session?.userId],
    queryFn: () => api.get<ListingOfferDto[]>("/marketplace/offers/mine", true),
    enabled: Boolean(session),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["offers-incoming"] });
    qc.invalidateQueries({ queryKey: ["offers-mine"] });
  };

  const accept = useMutation({
    mutationFn: (id: string) => api.post(`/marketplace/offers/${id}/accept`, undefined, true),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/marketplace/offers/${id}/reject`, { reason }, true),
    onSuccess: () => {
      setRejectId(null);
      setRejectReason("");
      invalidate();
    },
  });

  if (!session) return <DevLogin />;

  const offers = tab === "incoming" ? incoming : mine;

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">ข้อเสนอราคา</h1>
          <p className="mt-1 text-sm text-ink/50">
            จัดการข้อเสนอที่ได้รับและประวัติข้อเสนอที่คุณส่ง
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "incoming" ? "bg-ink text-white" : "bg-ink/5 text-ink/60"
            }`}
            onClick={() => setTab("incoming")}
          >
            ข้อเสนอที่ได้รับ ({incoming.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "mine" ? "bg-ink text-white" : "bg-ink/5 text-ink/60"
            }`}
            onClick={() => setTab("mine")}
          >
            ข้อเสนอที่ส่ง ({mine.length})
          </button>
        </div>

        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="card p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{offer.listing.catalogItem.name}</p>
                  <p className="mt-1 text-ink/60">
                    {tab === "incoming"
                      ? `จาก ${offer.buyer.displayName}`
                      : `ราคาประกาศ ${formatBaht(offer.listing.price)}`}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gold">
                    เสนอ {formatBaht(offer.amount)}
                  </p>
                  {offer.message && (
                    <p className="mt-2 rounded-md bg-ink/[0.04] px-3 py-2 text-ink/70">
                      {offer.message}
                    </p>
                  )}
                  {offer.rejectReason && (
                    <p className="mt-2 text-xs text-red-600">เหตุผล: {offer.rejectReason}</p>
                  )}
                  <p className="mt-2 text-xs text-ink/40">{formatDate(offer.createdAt)}</p>
                </div>
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold">
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </span>
              </div>

              {tab === "incoming" && offer.status === "PENDING" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="btn-primary"
                    disabled={accept.isPending}
                    onClick={() => accept.mutate(offer.id)}
                  >
                    ยอมรับราคา
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setRejectId(offer.id);
                      setRejectReason("");
                    }}
                  >
                    ปฏิเสธ
                  </button>
                </div>
              )}

              {tab === "mine" && offer.status === "ACCEPTED" && (
                <a
                  href={`/marketplace/${offer.listing.catalogItem.id}?offer=${offer.id}`}
                  className="btn-gold mt-4 inline-block"
                >
                  ซื้อในราคาที่ตกลง ({formatBaht(offer.amount)})
                </a>
              )}

              {rejectId === offer.id && (
                <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-4">
                  <label className="text-xs font-semibold text-ink/60">เหตุผลที่ปฏิเสธ</label>
                  <textarea
                    className="input min-h-20"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="เช่น ราคาต่ำเกินไป"
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn-primary"
                      disabled={!rejectReason.trim() || reject.isPending}
                      onClick={() => reject.mutate({ id: offer.id, reason: rejectReason.trim() })}
                    >
                      ยืนยันปฏิเสธ
                    </button>
                    <button className="btn-outline" onClick={() => setRejectId(null)}>
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {offers.length === 0 && (
            <p className="text-sm text-ink/40">ยังไม่มีข้อเสนอราคา</p>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
