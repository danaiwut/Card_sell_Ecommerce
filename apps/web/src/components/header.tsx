"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Bell, Heart, ShoppingCart, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isClerkEnabled } from "@/lib/clerk-config";
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
  const { session } = useSession();
  const pathname = usePathname();

  const { data: cart } = useQuery({
    queryKey: ["cart-count", session?.userId],
    queryFn: () => api.get<{ items: unknown[] }>("/cart", true),
    enabled: Boolean(session),
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", session?.userId],
    queryFn: () => api.get<{ unread: number }>("/notifications", true),
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });

  const unreadCount = notifications?.unread ?? 0;
  const cartCount = cart?.items?.length ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Cardivers Logo"
              width={36}
              height={36}
              className="rounded-lg object-contain"
              priority
            />
            <span className="font-display text-xl font-semibold tracking-tight">CardVerse</span>
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

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="text-xs font-semibold tracking-wider text-ink/60 hover:text-ink"
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
          <Link
            href="/account/wishlist"
            className={cn(
              "text-ink/60 hover:text-ink",
              pathname.startsWith("/account/wishlist") && "text-gold",
            )}
          >
            <Heart size={18} />
          </Link>
          <Link href="/cart" className="relative text-ink/60 hover:text-ink">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {isClerkEnabled() ? (
            <AuthControls />
          ) : (
            <Link
              href="/account"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink/70 hover:bg-ink/10"
            >
              <User size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthControls() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="text-xs font-semibold tracking-wider text-ink/60 hover:text-ink">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="btn-primary h-8 px-3 text-xs">Sign up</button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <Link
          href="/account"
          className="hidden text-xs font-semibold tracking-wider text-ink/60 hover:text-ink sm:block"
        >
          บัญชี
        </Link>
        <UserButton
          afterSignOutUrl="/"
          userProfileUrl="/account"
          appearance={{ elements: { avatarBox: "h-8 w-8" } }}
        />
      </SignedIn>
    </>
  );
}
