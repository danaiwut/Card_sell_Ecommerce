"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Tag,
  Settings,
  LogOut,
  ShieldCheck,
  Truck,
  Coins,
  Banknote,
  HandCoins,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { cn } from "@/lib/format";

const LINKS: {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { href: "/account", label: "Overview", shortLabel: "ภาพรวม", icon: LayoutDashboard },
  { href: "/account/wallet", label: "Wallet", shortLabel: "กระเป๋า", icon: Coins },
  { href: "/account/orders", label: "Shop Orders", shortLabel: "ออเดอร์", icon: ShoppingBag },
  { href: "/account/purchases", label: "Purchases", shortLabel: "ซื้อแล้ว", icon: Store },
  { href: "/account/shipments", label: "Shipments", shortLabel: "พัสดุ", icon: Truck },
  { href: "/account/sell", label: "Sell", shortLabel: "ลงขาย", icon: Tag },
  { href: "/account/offers", label: "Offers", shortLabel: "ข้อเสนอ", icon: HandCoins },
  { href: "/account/withdraw", label: "Withdraw", shortLabel: "ถอนเงิน", icon: Banknote },
  { href: "/account/settings", label: "Settings", shortLabel: "ตั้งค่า", icon: Settings },
];

function DesktopNav({ pathname }: { pathname: string }) {
  const { session } = useSession();

  return (
    <>
      {LINKS.filter((l) => l.href !== "/account/settings").map((l) => {
        const Icon = l.icon;
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition",
              active ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5 hover:text-ink",
            )}
          >
            <Icon size={15} className={active ? "text-gold" : "text-ink/30"} />
            {l.label}
          </Link>
        );
      })}
      {session?.role !== "customer" && (
        <Link
          href="/admin"
          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gold transition hover:bg-gold/10"
        >
          <ShieldCheck size={15} />
          Admin Dashboard
        </Link>
      )}
    </>
  );
}

export function AccountSidebar() {
  const pathname = usePathname();
  const { session, logout } = useSession();

  const { data: me } = useQuery({
    queryKey: ["me", session?.userId],
    queryFn: () =>
      api.get<{ displayName: string; email: string; avatarUrl?: string | null }>(
        "/users/me",
        true,
      ),
    enabled: Boolean(session),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", session?.userId],
    queryFn: () => api.get<{ balance: number }>("/wallet", true),
    enabled: Boolean(session),
  });

  const mobileLinks = [
    ...LINKS,
    ...(session?.role !== "customer"
      ? [{ href: "/admin", label: "Admin", shortLabel: "แอดมิน", icon: ShieldCheck }]
      : []),
  ];

  return (
    <>
      {/* Mobile: profile card + 2-col tap grid */}
      <div className="lg:hidden">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            {me?.avatarUrl ? (
              <img
                src={me.avatarUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
                {me?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{me?.displayName ?? "บัญชีของฉัน"}</p>
              <p className="truncate text-xs text-ink/50">{me?.email}</p>
            </div>
          </div>
          {wallet && (
            <Link
              href="/account/wallet"
              className="flex items-center justify-between border-t border-ink/8 bg-gold/5 px-4 py-3 active:bg-gold/10"
            >
              <span className="text-xs font-semibold tracking-wider text-ink/50 uppercase">
                ยอดเครดิต
              </span>
              <span className="text-base font-semibold text-gold">
                ฿{wallet.balance.toLocaleString()}
              </span>
            </Link>
          )}
        </div>

        <nav className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {mobileLinks.map((l) => {
            const Icon = l.icon;
            const active =
              l.href === "/account"
                ? pathname === "/account"
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 text-center transition active:scale-[0.98]",
                  active
                    ? "border-ink bg-ink text-white shadow-sm"
                    : "border-ink/10 bg-white text-ink/70 active:bg-ink/5",
                )}
              >
                <Icon size={20} className={active ? "text-gold" : "text-ink/40"} />
                <span className="text-[11px] font-semibold leading-tight">
                  {l.shortLabel}
                </span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white py-3 text-sm font-medium text-ink/50 active:bg-ink/5"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden h-fit overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card lg:block">
        <div className="bg-ink px-5 py-6 text-center text-white">
          {me?.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt=""
              className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
              {me?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
          <p className="mt-3 font-semibold">{me?.displayName ?? "บัญชีของฉัน"}</p>
          {me?.email && <p className="mt-0.5 text-xs text-white/50">{me.email}</p>}
          <span className="mt-2 inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gold">
            {session?.role}
          </span>
          {wallet && (
            <p className="mt-3 text-sm font-semibold text-gold">
              ฿{wallet.balance.toLocaleString()} credits
            </p>
          )}
        </div>

        <nav className="p-3 text-sm">
          <DesktopNav pathname={pathname} />
          <Link
            href="/account/settings"
            className={cn(
              "mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition",
              pathname === "/account/settings"
                ? "bg-ink text-white"
                : "text-ink/60 hover:bg-ink/5 hover:text-ink",
            )}
          >
            <Settings
              size={15}
              className={pathname === "/account/settings" ? "text-gold" : "text-ink/30"}
            />
            ตั้งค่า & ที่อยู่
          </Link>
          <div className="my-2 border-t border-ink/10" />
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-ink/40 transition hover:bg-ink/5 hover:text-ink"
          >
            <LogOut size={15} />
            Log out
          </button>
        </nav>
      </aside>
    </>
  );
}
