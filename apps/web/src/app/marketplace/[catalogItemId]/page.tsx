"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { ShoppingCart, Star } from "lucide-react";
import {
  SOCKET_EVENTS,
  type CatalogItemDto,
  type ListingDto,
  type MarketStatsDto,
  type Paginated,
  type TradeDto,
} from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatBaht, formatDate } from "@/lib/format";
import {
  DetailBreadcrumb,
  DetailTabs,
  PriceTrendBadge,
  RarityRibbon,
  RelatedCatalogCard,
  RelatedSectionHeader,
  SpecTile,
  VerifiedBadge,
} from "@/components/detail-layout";
import { PriceChart } from "@/components/price-chart";
import { WishlistButton } from "@/components/wishlist-button";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

const TABS = ["Card Info", "Price History", "Shipping & Returns", "Seller Reviews"] as const;
type Tab = (typeof TABS)[number];

function priceTrendPct(avg7d: number | null | undefined, avg30d: number | null | undefined) {
  if (avg7d == null || avg30d == null || avg30d === 0) return null;
  return ((avg7d - avg30d) / avg30d) * 100;
}

export default function CatalogDetailPage({
  params,
}: {
  params: Promise<{ catalogItemId: string }>;
}) {
  const { catalogItemId } = use(params);
  const listingId = useSearchParams().get("listing");
  const { t } = useI18n();
  const { session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("Card Info");

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
    queryFn: () => api.get<TradeDto[]>("/marketplace/recent-sales?limit=20"),
  });
  const { data: similarListings } = useQuery({
    queryKey: ["similar-listings", item?.category.slug],
    queryFn: () =>
      api.get<Paginated<ListingDto>>(
        `/marketplace/listings?category=${item!.category.slug}&pageSize=16`,
      ),
    enabled: !!item,
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
  const activeListing = listingId
    ? listings?.find((l) => l.id === listingId)
    : listings?.[0];
  const listingUnavailable = Boolean(listingId && listings && !activeListing);
  const trend = priceTrendPct(effStats?.avg7d, effStats?.avg30d);
  const displayPrice = activeListing?.price ?? effStats?.today ?? effStats?.lowestActiveListing;
  const lastSold = (recent ?? []).find((r) => r.catalogItem.id === catalogItemId);

  const similar = useMemo(() => {
    const seen = new Set<string>();
    return (similarListings?.items ?? [])
      .filter((l) => l.catalogItem.id !== catalogItemId && !seen.has(l.catalogItem.id))
      .filter((l) => {
        seen.add(l.catalogItem.id);
        return true;
      })
      .slice(0, 4);
  }, [similarListings, catalogItemId]);

  const buy = useMutation({
    mutationFn: () =>
      api.post<{ orderId: string; mock: boolean; clientSecret: string | null }>(
        `/marketplace/orders/${activeListing!.id}/buy`,
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["catalog-listings", catalogItemId] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      router.push(`/account/purchases/${res.orderId}`);
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", session?.userId],
    queryFn: () => api.get<{ balance: number }>("/wallet", true),
    enabled: Boolean(session),
  });

  const listingPrice = activeListing?.price ?? 0;
  const canBuyWithCredit = (wallet?.balance ?? 0) >= listingPrice;

  if (!item) return <div className="container-page py-10">Loading…</div>;

  const itemRecent = (recent ?? [])
    .filter((r) => r.catalogItem.id === catalogItemId)
    .slice(0, 6);

  return (
    <div className="container-page py-8">
      <DetailBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          ...(item.setName ? [{ label: item.setName, href: `/marketplace?category=${item.category.slug}` }] : []),
          { label: item.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left — card visual */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink/5 ring-1 ring-ink/10">
            {item.imageUrl && (
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" priority />
            )}
            {item.rarity && <RarityRibbon label={item.rarity} />}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <SpecTile label="SET" value={item.setName ?? "—"} />
            <SpecTile label="NUMBER" value={item.cardNumber ?? "—"} />
          </div>
        </div>

        {/* Right — details + tabs */}
        <div>
          <VerifiedBadge label="VERIFIED MARKETPLACE LISTING" />
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">{item.name}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <Tag label={item.category.name} />
            {item.brandName && <Tag label={item.brandName} />}
            {item.rarity && <Tag label={item.rarity} />}
            {activeListing && <Tag label={activeListing.condition.replace(/_/g, " ")} />}
          </div>

          {activeListing && (
            <div className="card mt-5 p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-2xl font-bold text-gold">
                  {activeListing.seller.rating.toFixed(1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{activeListing.condition.replace(/_/g, " ")}</p>
                  <p className="mt-0.5 text-sm text-ink/50">
                    Seller: {activeListing.seller.displayName}
                  </p>
                  <div className="mt-1 flex items-center gap-0.5 text-gold">
                    {Array.from({ length: Math.round(activeListing.seller.rating) }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                    <span className="ml-1 text-xs text-ink/50">
                      ({activeListing.seller.ratingCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-ink/10 pt-4 text-center">
                <GradeStat label="Rarity" value={item.rarity ?? "—"} />
                <GradeStat label="Set" value={item.setName?.slice(0, 8) ?? "—"} />
                <GradeStat label="Brand" value={item.brandName?.slice(0, 8) ?? "—"} />
                <GradeStat label="Qty" value={String(activeListing.quantity)} />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-3xl price">
                {displayPrice != null ? formatBaht(displayPrice) : "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PriceTrendBadge pct={trend} />
                {lastSold && (
                  <span className="text-xs text-ink/50">
                    Last sold: {formatBaht(lastSold.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {listingUnavailable && (
              <p className="text-sm text-ink/60 sm:basis-full">
                รายการที่เลือกไม่พร้อมขายแล้ว — ลองเลือกจาก Marketplace อีกครั้ง
              </p>
            )}
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!activeListing || buy.isPending || Boolean(session && !canBuyWithCredit)}
              onClick={() => {
                if (!session) return router.push("/sign-in");
                if (activeListing) buy.mutate();
              }}
            >
              <ShoppingCart size={16} />
              {buy.isPending ? "…" : `ซื้อด้วยเครดิต ${formatBaht(listingPrice)}`}
            </button>
            {session && !canBuyWithCredit && activeListing && (
              <p className="text-sm text-red-600 sm:basis-full">
                เครดิตไม่พอ ({formatBaht(wallet?.balance ?? 0)}) —{" "}
                <Link href="/account/wallet" className="underline">
                  เติมเครดิต
                </Link>
              </p>
            )}
            <WishlistButton catalogItemId={catalogItemId} />
            <Link href="/account/sell" className="btn-outline flex-1">
              Make an Offer
            </Link>
          </div>

          <DetailTabs tabs={[...TABS]} active={tab} onChange={(v) => setTab(v as Tab)} />

          {tab === "Card Info" && (
            <div className="py-5 text-sm leading-relaxed text-ink/70">
              <p>
                {item.name} from the {item.setName ?? item.category.name} collection.
                {item.brandName ? ` Produced by ${item.brandName}.` : ""}
                {item.rarity ? ` Rarity: ${item.rarity}.` : ""}
              </p>
              <dl className="mt-4 space-y-2">
                <InfoRow label="Category" value={item.category.name} />
                <InfoRow label="Subcategory" value={item.subcategoryName ?? "—"} />
                <InfoRow label="Card Number" value={item.cardNumber ?? "—"} />
                <InfoRow label="Set" value={item.setName ?? "—"} />
              </dl>
            </div>
          )}

          {tab === "Price History" && (
            <div className="py-5">
              <div className="mb-4 grid grid-cols-3 gap-3">
                <MarketStat label={t("market.today")} value={effStats?.today} />
                <MarketStat label="7 Days" value={effStats?.avg7d} />
                <MarketStat label="30 Days" value={effStats?.avg30d} />
              </div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-ink/50">
                30-DAY MARKET VALUE
              </p>
              <PriceChart history={effStats?.history ?? []} />
            </div>
          )}

          {tab === "Shipping & Returns" && (
            <div className="space-y-3 py-5 text-sm text-ink/70">
              <p>
                Marketplace orders use escrow: payment is held until the buyer confirms delivery.
                Sellers must provide a carrier and tracking number within the platform.
              </p>
              <p>
                Standard domestic shipping applies. Insured shipping is recommended for high-value
                cards. Returns and disputes can be opened from your account purchases page.
              </p>
            </div>
          )}

          {tab === "Seller Reviews" && (
            <div className="py-5">
              {activeListing ? (
                <div className="card mb-4 p-4 text-sm">
                  <p className="font-semibold">{activeListing.seller.displayName}</p>
                  <p className="mt-1 text-ink/60">
                    Rating {activeListing.seller.rating.toFixed(1)} / 5 · {activeListing.seller.ratingCount}{" "}
                    reviews
                  </p>
                </div>
              ) : null}
              <p className="mb-3 text-xs font-semibold tracking-wider text-ink/50">
                {t("market.recentSales")}
              </p>
              <table className="w-full text-sm">
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
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16 border-t border-ink/10 pt-12">
          <RelatedSectionHeader
            title="Similar Rare Finds"
            subtitle={
              item.setName
                ? `Curated selections from the ${item.setName} cycle.`
                : `More from ${item.category.name}.`
            }
            href={`/marketplace?category=${item.category.slug}`}
            linkLabel="View Entire Set"
          />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {similar.map((l) => (
              <RelatedCatalogCard
                key={l.id}
                href={`/marketplace/${l.catalogItem.id}?listing=${l.id}`}
                name={l.catalogItem.name}
                imageUrl={l.catalogItem.imageUrl}
                meta={`${l.catalogItem.setName ?? item.category.name} · ${l.condition.replace(/_/g, " ")}`}
                price={formatBaht(l.price)}
                badge={l.catalogItem.rarity ?? undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-medium text-ink/70">
      {label}
    </span>
  );
}

function GradeStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-ink/45">{label}</p>
    </div>
  );
}

function MarketStat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3 text-center">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-semibold text-gold">{value != null ? formatBaht(value) : "—"}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 py-1.5">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
