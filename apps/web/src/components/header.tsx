"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, ShoppingCart, User, X, LogOut } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const mobileMenu =
    mounted &&
    mobileOpen &&
    createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-ink/50 md:hidden"
          aria-label="ปิดเมนู"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="fixed inset-y-0 left-0 z-[101] flex w-[min(88vw,320px)] flex-col bg-white shadow-2xl md:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-4 py-4">
            <span className="font-display text-lg font-semibold">เมนู</span>
            <button
              type="button"
              className="rounded-md p-2 text-ink/50 hover:bg-ink/5"
              aria-label="ปิดเมนู"
              onClick={() => setMobileOpen(false)}
            >
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
                    "block rounded-lg px-4 py-3 text-sm font-medium",
                    active ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              {t("cart.title") ?? "Cart"}
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              บัญชี
            </Link>
          </nav>
          <div className="shrink-0 border-t border-ink/10 p-4">
            <button
              type="button"
              onClick={() => setLocale(locale === "th" ? "en" : "th")}
              className="w-full rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70"
            >
              {locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
            </button>
          </div>
        </aside>
      </>,
      document.body,
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-8">
          <button
            type="button"
            className="rounded-md p-2 text-ink/60 hover:bg-ink/5 md:hidden"
            aria-label="เปิดเมนู"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="Cardivers Logo"
              width={36}
              height={36}
              className="rounded-lg object-contain"
              priority
            />
            <span className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">
              CardVerse
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-link relative py-1",
                    active && "text-ink after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:bg-gold",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="hidden text-xs font-semibold tracking-wider text-ink/60 hover:text-ink sm:inline"
          >
            {locale === "th" ? "TH | en" : "th | EN"}
          </button>
          <Link href="/notifications" className="relative text-ink/60 hover:text-ink">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative text-ink/60 hover:text-ink">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="flex h-9 items-center gap-1.5 rounded-full border border-ink/10 bg-white pl-1 pr-2.5 text-ink/70 shadow-sm transition hover:border-gold/40 hover:text-ink"
                aria-label="บัญชีของฉัน"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white">
                  <User size={14} />
                </span>
                <span className="hidden max-w-[5rem] truncate text-xs font-semibold sm:inline">
                  {session.displayName}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-md p-2 text-ink/50 hover:bg-ink/5 hover:text-ink sm:inline"
                aria-label="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="hidden text-xs font-semibold text-ink/60 hover:text-ink sm:inline">
                เข้าสู่ระบบ
              </Link>
              <Link href="/sign-up" className="btn-primary h-8 px-3 text-xs">
                สมัคร
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileMenu}
    </header>
  );
}
