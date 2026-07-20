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
} from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { cn } from "@/lib/format";

const LINKS = [

  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/wallet", label: "Wallet", icon: Coins, shortLabel: "Wallet" },
  { href: "/account/orders", label: "Shop Orders", icon: ShoppingBag, shortLabel: "Orders" },
  { href: "/account/purchases", label: "Purchases", icon: Store },
  { href: "/account/shipments", label: "Shipments", icon: Truck },
  { href: "/account/sell", label: "Sell", icon: Tag },
  { href: "/account/withdraw", label: "Withdraw", icon: Banknote },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  variant,
}: {
  pathname: string;
  variant: "mobile" | "desktop";
}) {
  const { session } = useSession();

  if (variant === "mobile") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                active ? "bg-ink text-white" : "bg-ink/5 text-ink/60",
              )}
            >
              {l.shortLabel ?? l.label}
            </Link>
          );
        })}
        {session?.role !== "customer" && (
          <Link
            href="/admin"
            className="shrink-0 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold"
          >
            Admin
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {LINKS.map((l) => {
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
    queryFn: () => api.get<{ displayName: string; email: string }>("/users/me", true),
    enabled: Boolean(session),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", session?.userId],
    queryFn: () => api.get<{ balance: number }>("/wallet", true),
    enabled: Boolean(session),
  });

  return (
    <>
      <div className="lg:hidden">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
            {me?.displayName?.charAt(0)?.toUpperCase() ?? "👤"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{me?.displayName ?? "บัญชีของฉัน"}</p>
            <p className="truncate text-xs text-ink/50">{me?.email}</p>
          </div>
          {wallet && (
            <p className="shrink-0 text-sm font-semibold text-gold">
              ฿{wallet.balance.toLocaleString()}
            </p>
          )}
        </div>
        <div className="mt-3">
          <NavLinks pathname={pathname} variant="mobile" />
        </div>
      </div>

      <aside className="hidden h-fit overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card lg:block">
        <div className="bg-ink px-5 py-6 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
            {me?.displayName?.charAt(0)?.toUpperCase() ?? "👤"}
          </div>
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
          <NavLinks pathname={pathname} variant="desktop" />
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
