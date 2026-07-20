"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Store, Tag, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";
import { ResponsiveTable } from "@/components/responsive-table";
import { formatBaht, formatDate } from "@/lib/format";
import { uploadImage } from "@/lib/upload";
import { useState } from "react";

interface Me {
  displayName: string;
  avatarUrl?: string | null;
  level: number;
  stats: { orders: number; purchases: number; listings: number };
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
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { data } = useQuery({
    queryKey: ["me", session?.userId],
    queryFn: () => api.get<Me>("/users/me", true),
    enabled: Boolean(session),
  });

  const saveAvatar = useMutation({
    mutationFn: (avatarUrl: string) => api.patch("/users/me", { avatarUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  if (!session) return <DevLogin />;

  const stats = [
    { label: "Shop Orders", value: data?.stats.orders ?? 0, icon: ShoppingBag, href: "/account/orders" },
    { label: "Purchases", value: data?.stats.purchases ?? 0, icon: Store, href: "/account/purchases" },
    { label: "My Listings", value: data?.stats.listings ?? 0, icon: Tag, href: "/account/sell" },
  ];

  return (
    <AccountLayout>
        <div className="space-y-6">
          <div className="card flex flex-wrap items-center gap-5 p-5">
            {data?.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-gold/30" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-white">
                {data?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">บัญชีของฉัน</p>
              <h1 className="page-title mt-1 text-ink">{data?.displayName ?? "บัญชีของฉัน"}</h1>
              <p className="mt-1 text-sm text-ink/50">Level {data?.level ?? 1}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="cursor-pointer text-xs font-semibold text-gold hover:underline">
                  เปลี่ยนรูปโปรไฟล์
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const url = await uploadImage(file, "avatars");
                        saveAvatar.mutate(url);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                <Link href="/account/settings" className="text-xs font-semibold text-ink/50 hover:text-ink">
                  ตั้งค่า & ที่อยู่ →
                </Link>
              </div>
              {uploading && <p className="mt-1 text-xs text-ink/40">กำลังอัปโหลด...</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
              <ResponsiveTable>
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
              </ResponsiveTable>
            </div>
          </div>
        </div>
    </AccountLayout>
  );
}
