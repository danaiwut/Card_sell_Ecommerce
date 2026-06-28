"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { formatBaht, formatDate } from "@/lib/format";

interface Me {
  displayName: string;
  level: number;
  stats: { orders: number; wishlist: number; myCards: number; coupons: number };
  recentOrders: { orderNumber: string; date: string; total: number; status: string }[];
}

export default function AccountPage() {
  const { session } = useSession();
  const { data } = useQuery({
    queryKey: ["me", session?.userId],
    queryFn: () => api.get<Me>("/users/me", true),
    enabled: Boolean(session),
  });

  if (!session) return <DevLogin />;

  const stats = [
    { label: "ORDERS", value: data?.stats.orders ?? 0 },
    { label: "WISHLIST", value: data?.stats.wishlist ?? 0 },
    { label: "MY CARDS", value: data?.stats.myCards ?? 0 },
    { label: "COUPONS", value: data?.stats.coupons ?? 0 },
  ];

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <h1 className="font-display text-3xl font-semibold">ACCOUNT OVERVIEW</h1>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-xs font-semibold tracking-wider text-ink/50">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold tracking-wider text-ink/50">RECENT ORDERS</h2>
          <div className="card mt-3 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
                <tr>
                  <th className="px-4 py-3">Order No.</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders ?? []).map((o) => (
                  <tr key={o.orderNumber} className="border-b border-ink/5">
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-ink/60">{formatDate(o.date)}</td>
                    <td className="px-4 py-3 price">{formatBaht(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(data?.recentOrders.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink/40">
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
  );
}
