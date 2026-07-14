"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { formatBaht } from "@/lib/format";

interface CollectionCard {
  id: string;
  quantity: number;
  catalogItem: {
    id: string;
    name: string;
    setName: string | null;
    rarity: string | null;
    category: { name: string };
    imageUrl: string | null;
  };
}

export default function CollectionPage() {
  const { session } = useSession();
  const qc = useQueryClient();

  const { data: cards } = useQuery({
    queryKey: ["collection-cards", session?.userId],
    queryFn: () => api.get<CollectionCard[]>("/collection/cards", true),
    enabled: Boolean(session),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", session?.userId],
    queryFn: () => api.get<CollectionCard[]>("/collection/wishlist", true),
    enabled: Boolean(session),
  });

  const removeWish = useMutation({
    mutationFn: (catalogItemId: string) =>
      api.post("/collection/wishlist/toggle", { catalogItemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <div className="border-b border-ink/10 pb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              Collection
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">คอลเลกชันของฉัน</h1>
          </div>

          <section className="mt-6">
            <h2 className="font-semibold">การ์ดที่สะสม ({cards?.length ?? 0})</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(cards ?? []).map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.catalogItem.id}`}
                  className="card flex gap-3 p-4 transition hover:border-gold/30"
                >
                  {item.catalogItem.imageUrl && (
                    <img
                      src={item.catalogItem.imageUrl}
                      alt=""
                      className="h-16 w-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{item.catalogItem.name}</p>
                    <p className="text-xs text-ink/50">
                      {item.catalogItem.category.name} × {item.quantity}
                    </p>
                  </div>
                </Link>
              ))}
              {(cards?.length ?? 0) === 0 && (
                <p className="text-sm text-ink/40 sm:col-span-2">
                  ยังไม่มีการ์ดในคอลเลกชัน — ซื้อจาก Marketplace แล้วเพิ่มได้
                </p>
              )}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Wishlist ({wishlist?.length ?? 0})</h2>
              <Link href="/account/wishlist" className="text-sm text-gold hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {(wishlist ?? []).slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3 text-sm"
                >
                  <Link
                    href={`/marketplace/${item.catalogItem.id}`}
                    className="font-medium hover:text-gold"
                  >
                    {item.catalogItem.name}
                  </Link>
                  <button
                    className="text-xs text-ink/40 hover:text-red-500"
                    onClick={() => removeWish.mutate(item.catalogItem.id)}
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
