"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Heart, Share2 } from "lucide-react";
import {
  SOCKET_EVENTS,
  type CatalogItemDto,
  type ListingDto,
  type MarketStatsDto,
  type TradeDto,
} from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatBaht, formatDate } from "@/lib/format";
import { PriceChart } from "@/components/price-chart";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

export default function CatalogDetailPage({
  params,
}: {
  params: Promise<{ catalogItemId: string }>;
}) {
  const { catalogItemId } = use(params);
  const { t } = useI18n();
  const { session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: item } = useQuery({
    queryKey: ["catalog-item", catalogItemId],
    queryFn: () => api.get<CatalogItemDto>(`/catalog-items/${catalogItemId}`),
  });
  const { data: stats } = useQuery({
    queryKey: ["stats", catalogItemId],
    queryFn: () => api.get<MarketStatsDto>(`/marketplace/stats/${catalogItemId}`),
  });
  const { data: listings } = useQuery({
    queryKey: ["catalog-listings", catalogItemId],
    queryFn: () => api.get<ListingDto[]>(`/marketplace/catalog/${catalogItemId}/listings`),
  });
  const { data: recent } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => api.get<TradeDto[]>("/marketplace/recent-sales?limit=10"),
  });

  const [liveStats, setLiveStats] = useState<MarketStatsDto | null>(null);
  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket"] });
    socket.on(SOCKET_EVENTS.PRICE_UPDATE, (s: MarketStatsDto) => {
      if (s.catalogItemId === catalogItemId) setLiveStats(s);
    });
    return () => {
      socket.disconnect();
    };
  }, [catalogItemId]);

  const effStats = liveStats ?? stats;
  const lowest = listings?.[0];

  const buy = useMutation({
    mutationFn: () =>
      api.post<{ orderId: string; mock: boolean; clientSecret: string | null }>(
        `/marketplace/orders/${lowest!.id}/buy`,
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["catalog-listings", catalogItemId] });
      router.push(`/account/purchases?status=success&order=${res.orderId}`);
    },
  });

  if (!item) return <div className="container-page py-10">Loading…</div>;

  const itemRecent = (recent ?? []).filter((r) => r.catalogItem.id === catalogItemId).slice(0, 6);

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink/5">
            {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-outline flex-1">
              <Heart size={16} /> {t("common.wishlist")}
            </button>
            <button className="btn-outline">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold">{item.name}</h1>
          <p className="text-sm text-ink/50">
            {item.category.name} / {item.setName ?? "—"} / {item.cardNumber ?? "—"}
          </p>

          {/* Market price */}
          <div className="card mt-5 p-5">
            <p className="text-xs font-semibold tracking-wider text-ink/50">
              {t("market.marketPrice")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Stat label={t("market.today")} value={effStats?.today} />
              <Stat label="7 Days" value={effStats?.avg7d} />
              <Stat label="30 Days" value={effStats?.avg30d} />
            </div>
            <div className="mt-4">
              <PriceChart history={effStats?.history ?? []} />
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="card p-5">
              <p className="text-xs font-semibold tracking-wider text-ink/50">
                {t("market.lowestPrice")}
              </p>
              {lowest ? (
                <>
                  <p className="mt-2 text-sm text-ink/50">Seller</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{lowest.seller.displayName}</span>
                    <span className="text-xl price">{formatBaht(lowest.price)}</span>
                  </div>
                  <button
                    className="btn-primary mt-4 w-full"
                    disabled={buy.isPending}
                    onClick={() => {
                      if (!session) return router.push("/account");
                      buy.mutate();
                    }}
                  >
                    {buy.isPending ? "…" : t("common.buyNow")}
                  </button>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink/40">ยังไม่มีประกาศขาย</p>
              )}
            </div>

            <div className="card p-5">
              <p className="text-xs font-semibold tracking-wider text-ink/50">CARD INFORMATION</p>
              <dl className="mt-3 space-y-1 text-sm text-ink/70">
                <Info label="Rarity" value={item.rarity ?? "—"} />
                <Info label="Brand" value={item.brandName ?? "—"} />
                <Info label="Category" value={item.category.name} />
              </dl>
            </div>
          </div>

          {/* Recent sales */}
          <div className="card mt-5 p-5">
            <p className="text-xs font-semibold tracking-wider text-ink/50">
              {t("market.recentSales")}
            </p>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-ink/50">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Seller</th>
                </tr>
              </thead>
              <tbody>
                {itemRecent.map((r) => (
                  <tr key={r.id} className="border-t border-ink/5">
                    <td className="py-2">{formatDate(r.soldAt)}</td>
                    <td className="py-2 price">{formatBaht(r.price)}</td>
                    <td className="py-2">{r.sellerName}</td>
                  </tr>
                ))}
                {itemRecent.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-ink/40">
                      ยังไม่มีประวัติการขาย
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-lg bg-ink/[0.04] p-3 text-center">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-semibold text-gold">{value != null ? formatBaht(value) : "—"}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 py-1">
      <dt>{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
