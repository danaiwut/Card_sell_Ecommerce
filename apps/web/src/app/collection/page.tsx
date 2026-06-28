"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import type { CatalogItemDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

interface OverviewRow {
  id: string;
  name: string;
  nameTh: string;
  owned: number;
  total: number;
  percent: number;
}
interface CardRow {
  id: string;
  catalogItem: CatalogItemDto;
}

function CollectionInner() {
  const { session } = useSession();
  const [tab, setTab] = useState<"overview" | "cards" | "wishlist">("overview");

  const { data: overview } = useQuery({
    queryKey: ["collection-overview", session?.userId],
    queryFn: () => api.get<OverviewRow[]>("/collection/overview", true),
    enabled: Boolean(session),
  });
  const { data: cards } = useQuery({
    queryKey: ["collection-cards", session?.userId],
    queryFn: () => api.get<CardRow[]>("/collection/cards", true),
    enabled: Boolean(session),
  });
  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", session?.userId],
    queryFn: () => api.get<CardRow[]>("/collection/wishlist", true),
    enabled: Boolean(session),
  });

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">กรุณาเข้าสู่ระบบเพื่อดูคอลเลกชันของคุณ</p>
        <Link href="/account" className="btn-primary mt-4">เข้าสู่ระบบ</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-semibold">My Collection</h1>

      <div className="mt-4 flex gap-6 border-b border-ink/10 text-sm">
        {(["overview", "cards", "wishlist"] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`pb-2 font-semibold uppercase tracking-wider ${
              tab === tb ? "border-b-2 border-gold text-ink" : "text-ink/50"
            }`}
          >
            {tb === "overview" ? "Overview" : tb === "cards" ? "My Cards" : "Wishlist"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(overview ?? []).map((c) => (
            <div key={c.id} className="card p-4">
              <p className="text-xs font-semibold tracking-wider text-ink/50">{c.name.toUpperCase()}</p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {c.owned} / {c.total}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-gold" style={{ width: `${c.percent}%` }} />
              </div>
              <p className="mt-1 text-right text-xs text-ink/50">{c.percent}%</p>
            </div>
          ))}
        </div>
      )}

      {tab === "cards" && <CardGrid rows={cards} empty="ยังไม่มีการ์ดในคอลเลกชัน" />}
      {tab === "wishlist" && <CardGrid rows={wishlist} empty="ยังไม่มีรายการโปรด" />}
    </div>
  );
}

function CardGrid({ rows, empty }: { rows?: CardRow[]; empty: string }) {
  if (!rows?.length) return <p className="mt-8 text-sm text-ink/40">{empty}</p>;
  return (
    <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-6">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/marketplace/${r.catalogItem.id}`}
          className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink/5"
        >
          {r.catalogItem.imageUrl && (
            <Image src={r.catalogItem.imageUrl} alt={r.catalogItem.name} fill className="object-cover" />
          )}
        </Link>
      ))}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <CollectionInner />
    </Suspense>
  );
}
