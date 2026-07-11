"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { formatBaht } from "@/lib/format";

interface WishlistItem {
  id: string;
  catalogItem: {
    id: string;
    name: string;
    setName: string | null;
    rarity: string | null;
    category: { name: string };
  };
}

export default function AccountWishlistPage() {
  const { session } = useSession();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["wishlist", session?.userId],
    queryFn: () => api.get<WishlistItem[]>("/collection/wishlist", true),
    enabled: Boolean(session),
  });

  const remove = useMutation({
    mutationFn: (catalogItemId: string) =>
      api.post("/collection/wishlist/toggle", { catalogItemId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <div className="border-b border-ink/10 pb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              Marketplace
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
              รายการโปรด
            </h1>
            <p className="mt-1 text-sm text-ink/50">
              สินค้าที่คุณบันทึกไว้จาก Marketplace และ Shop
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {(data ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white px-5 py-4 transition hover:border-ink/20"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/marketplace/${item.catalogItem.id}`}
                    className="font-medium text-ink hover:text-gold"
                  >
                    {item.catalogItem.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {item.catalogItem.category.name}
                    {item.catalogItem.setName ? ` · ${item.catalogItem.setName}` : ""}
                    {item.catalogItem.rarity ? ` · ${item.catalogItem.rarity}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/marketplace/${item.catalogItem.id}`}
                    className="btn-outline h-8 px-3 text-xs"
                  >
                    ดูสินค้า
                  </Link>
                  <button
                    type="button"
                    className="text-ink/30 hover:text-red-500"
                    onClick={() => remove.mutate(item.catalogItem.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {(data?.length ?? 0) === 0 && (
              <div className="rounded-xl border border-dashed border-ink/15 py-16 text-center">
                <Heart size={32} className="mx-auto text-ink/15" />
                <p className="mt-3 text-sm text-ink/40">ยังไม่มีรายการโปรด</p>
                <Link href="/marketplace" className="btn-primary mt-4 inline-flex text-xs">
                  ไปที่ Marketplace
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
