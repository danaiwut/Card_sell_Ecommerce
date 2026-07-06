"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CatalogItemDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

interface CardRow {
  id: string;
  catalogItem: CatalogItemDto;
}

function CollectionInner() {
  const { session } = useSession();
  const qc = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", session?.userId],
    queryFn: () => api.get<CardRow[]>("/collection/wishlist", true),
    enabled: Boolean(session),
  });

  // toggle = add ถ้าไม่มี, remove ถ้ามีอยู่แล้ว
  // เรียก toggle ตอนการ์ดอยู่ใน wishlist แล้ว → ลบออก
  const remove = useMutation({
    mutationFn: (catalogItemId: string) =>
      api.post("/collection/wishlist/toggle", { catalogItemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">กรุณาเข้าสู่ระบบเพื่อดู wishlist ของคุณ</p>
        <Link href="/account" className="btn-primary mt-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">Wishlist</h1>
        {(wishlist?.length ?? 0) > 0 && (
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/60">
            {wishlist?.length} รายการ
          </span>
        )}
      </div>

      {!wishlist?.length ? (
        <p className="mt-8 text-sm text-ink/40">ยังไม่มีรายการโปรด</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-6">
          {wishlist.map((r) => (
            <div key={r.id} className="group relative">
              {/* กดที่รูปไปหน้า marketplace */}
              <Link
                href={`/marketplace/${r.catalogItem.id}`}
                className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-ink/5"
              >
                {r.catalogItem.imageUrl && (
                  <Image
                    src={r.catalogItem.imageUrl}
                    alt={r.catalogItem.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                )}
              </Link>

              {/* ปุ่ม X ลบออกจาก wishlist — โชว์ตอน hover */}
              <button
                type="button"
                aria-label={`ลบ ${r.catalogItem.name} ออกจาก wishlist`}
                onClick={() => remove.mutate(r.catalogItem.id)}
                disabled={remove.isPending}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white hover:bg-black/80 group-hover:flex"
              >
                <X size={12} />
              </button>

              {/* ชื่อการ์ด */}
              <p className="mt-1.5 truncate text-xs text-ink/60">{r.catalogItem.name}</p>
            </div>
          ))}
        </div>
      )}
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

