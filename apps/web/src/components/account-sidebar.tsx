"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/account", label: "OVERVIEW" },
  { href: "/account/orders", label: "ORDERS" },
  { href: "/account/purchases", label: "MARKETPLACE" },
  { href: "/account/sell", label: "SELL / MY LISTINGS" },
  { href: "/account/addresses", label: "ที่อยู่จัดส่ง" },
  { href: "/collection", label: "WISHLIST" },
  { href: "/account/settings", label: "SETTINGS" },
];


export function AccountSidebar() {
  const pathname = usePathname();
  const { session, logout } = useSession();

  return (
    <aside className="card h-fit p-4">
      <div className="flex flex-col items-center border-b border-ink/10 pb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-2xl">👤</div>
        <p className="mt-2 font-semibold">{session?.displayName ?? session?.userId}</p>
        <p className="text-xs uppercase tracking-wider text-ink/50">{session?.role}</p>
      </div>
      <nav className="mt-4 space-y-1 text-sm">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "block rounded-md px-3 py-2 font-medium",
              pathname === l.href ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5",
            )}
          >
            {l.label}
          </Link>
        ))}
        {session?.role !== "customer" && (
          <Link href="/admin" className="block rounded-md px-3 py-2 font-medium text-gold hover:bg-gold/10">
            ADMIN DASHBOARD
          </Link>
        )}
        <button
          onClick={logout}
          className="block w-full rounded-md px-3 py-2 text-left font-medium text-ink/60 hover:bg-ink/5"
        >
          LOG OUT
        </button>
      </nav>
    </aside>
  );
}
