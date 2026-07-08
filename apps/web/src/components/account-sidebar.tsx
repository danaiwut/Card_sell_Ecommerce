"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Tag,
  Heart,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: ShoppingBag },
  { href: "/account/purchases", label: "Marketplace", icon: Store },
  { href: "/account/sell", label: "Sell / My Listings", icon: Tag },
  { href: "/collection", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { session, logout } = useSession();

  return (
    <aside className="card h-fit overflow-hidden p-0">
      {/* Profile section */}
      <div className="bg-ink px-5 py-6 text-center text-white">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
          👤
        </div>
        <p className="mt-3 font-semibold">{session?.userId ?? "—"}</p>
        <span className="mt-1 inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gold">
          {session?.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="p-3 text-sm">
        {LINKS.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition",
                active
                  ? "bg-ink text-white"
                  : "text-ink/60 hover:bg-ink/5 hover:text-ink",
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
            className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gold hover:bg-gold/10 transition"
          >
            <ShieldCheck size={15} />
            Admin Dashboard
          </Link>
        )}

        <div className="my-2 border-t border-ink/10" />

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-ink/40 hover:bg-ink/5 hover:text-ink transition"
        >
          <LogOut size={15} />
          Log out
        </button>
      </nav>
    </aside>
  );
}
