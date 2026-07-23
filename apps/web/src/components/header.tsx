"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search, ShoppingCart, User, X, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/shop", key: "nav.shop" },
  { href: "/marketplace", key: "nav.marketplace" },
  { href: "/news", key: "nav.news" },
] as const;

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const { session, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => setMounted(true), []);

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart", session?.userId],
    queryFn: () => api.get<{ items: unknown[] }>("/cart", true),
    enabled: Boolean(session),
    select: (data) => data.items.length,
    staleTime: 60_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", session?.userId],
    queryFn: () => api.get<{ unread: number }>("/notifications", true),
    enabled: Boolean(session),
    select: (data) => data.unread,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  const mobileMenu =
    mounted &&
    mobileOpen &&
    createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-black/50 md:hidden"
          aria-label="ปิดเมนู"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="fixed inset-y-0 left-0 z-[101] flex w-[min(88vw,320px)] flex-col bg-white shadow-2xl md:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-4">
            <span className="text-lg font-black uppercase">Menu</span>
            <button type="button" className="rounded-full p-2" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-sm font-medium",
                    active ? "bg-black text-white" : "text-black/70 hover:bg-surface",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </aside>
      </>,
      document.body,
    );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
        <div className="container-page flex h-16 items-center gap-4 lg:gap-8">
          <button
            type="button"
            className="rounded-full p-2 md:hidden"
            aria-label="เปิดเมนู"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="shrink-0 text-xl font-black uppercase tracking-tight lg:text-2xl">
            CardVerse
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-link",
                    active && "font-medium text-black",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <form onSubmit={runSearch} className="hidden min-w-0 flex-1 md:flex">
            <div className="relative w-full max-w-xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search for products..."
                className="input w-full pl-11"
              />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setLocale(locale === "th" ? "en" : "th")}
              className="hidden text-xs font-medium text-black/50 sm:inline"
            >
              {locale === "th" ? "TH" : "EN"}
            </button>
            <Link href="/notifications" className="relative rounded-full p-2 hover:bg-surface">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative rounded-full p-2 hover:bg-surface">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {session ? (
              <div className="flex items-center gap-1">
                <Link href="/account" className="rounded-full p-2 hover:bg-surface" aria-label="Account">
                  <User size={20} />
                </Link>
                <button type="button" onClick={logout} className="hidden rounded-full p-2 hover:bg-surface sm:inline">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/sign-in" className="hidden rounded-full bg-black px-4 py-2 text-xs font-medium text-white sm:inline">
                Sign In
              </Link>
            )}
          </div>
        </div>
        {mobileMenu}
      </header>
    </>
  );
}
