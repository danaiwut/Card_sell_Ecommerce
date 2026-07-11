"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Store, Heart, Tag, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { formatBaht, formatDate } from "@/lib/format";

interface Me {
  displayName: string;
  level: number;
  stats: { orders: number; purchases: number; wishlist: number; listings: number };
  recentOrders: { orderNumber: string; date: string; total: number; status: string }[];
}

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function AccountPage() {
  const { session } = useSession();
  const { data } = useQuery({
    queryKey: ["me", session?.userId],
    queryFn: () => api.get<Me>("/users/me", true),
    enabled: Boolean(session),
  });

  if (!session) return <DevLogin />;

  const stats = [
    { label: "Shop Orders", value: data?.stats.orders ?? 0, icon: ShoppingBag, href: "/account/orders" },
    { label: "Purchases", value: data?.stats.purchases ?? 0, icon: Store, href: "/account/purchases" },
    { label: "Wishlist", value: data?.stats.wishlist ?? 0, icon: Heart, href: "/account/wishlist" },
    { label: "My Listings", value: data?.stats.listings ?? 0, icon: Tag, href: "/account/sell" },
  ];

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />

        <div className="space-y-6">
          <div className="border-b border-ink/10 pb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              That Marketplace
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
              {data?.displayName ?? "บัญชีของฉัน"}
            </h1>
            <p className="mt-1 text-sm text-ink/50">
              จัดการคำสั่งซื้อ การซื้อขาย และรายการโปรดของคุณ
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className="group flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-5 shadow-card transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                      {s.label}
                    </span>
                    <Icon size={15} className="text-ink/20 transition group-hover:text-gold" />
                  </div>
                  <p className="font-display text-3xl font-semibold text-ink">{s.value}</p>
                </Link>
              );
            })}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
                คำสั่งซื้อล่าสุด
              </h2>
              <Link
                href="/account/orders"
                className="flex items-center gap-1 text-xs font-medium text-gold hover:underline"
              >
                ดูทั้งหมด <ArrowRight size={12} />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-semibold uppercase tracking-wider text-ink/40">
                  <tr>
                    <th className="px-5 py-3">Order No.</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {(data?.recentOrders ?? []).map((o) => (
                    <tr key={o.orderNumber} className="transition hover:bg-ink/[0.015]">
                      <td className="px-5 py-3.5 font-medium text-ink">{o.orderNumber}</td>
                      <td className="px-5 py-3.5 text-ink/50">{formatDate(o.date)}</td>
                      <td className="px-5 py-3.5 font-semibold text-gold">{formatBaht(o.total)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_STYLE[o.status] ?? "bg-ink/10 text-ink/60"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(data?.recentOrders.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink/30">
                        ยังไม่มีคำสั่งซื้อ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
