"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import type { CatalogItemDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

interface CardRow {
  id: string;
  catalogItem: CatalogItemDto;
}

function CollectionInner() {
  const { session } = useSession();
  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", session?.userId],
    queryFn: () => api.get<CardRow[]>("/collection/wishlist", true),
    enabled: Boolean(session),
  });

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">กรุณาเข้าสู่ระบบเพื่อดู wishlist ของคุณ</p>
        <Link href="/account" className="btn-primary mt-4">เข้าสู่ระบบ</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-semibold">Wishlist</h1>
      <p className="mt-2 text-sm text-ink/50">
        เก็บรายการการ์ดที่สนใจไว้ที่นี่ ส่วน My Cards/Collection ถูกซ่อนจากฝั่งผู้ใช้แล้ว
      </p>

      <CardGrid rows={wishlist} empty="ยังไม่มีรายการโปรด" />
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
