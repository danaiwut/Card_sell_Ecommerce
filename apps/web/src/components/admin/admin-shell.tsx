"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { cn } from "@/lib/format";
import {
  ADMIN_MAIN_NAV,
  getAdminTabLabel,
  resolveAdminTab,
  type AdminTab,
} from "./admin-nav";

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { session, logout, isLoaded } = useSession();
  const searchParams = useSearchParams();
  const activeTab = resolveAdminTab(searchParams.get("tab"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", session?.userId],
    queryFn: () => api.get<{ unread: number }>("/notifications", true),
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f2ec] text-sm text-ink/50">
        กำลังโหลด...
      </div>
    );
  }

  if (!session || session.role === "customer") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f2ec] px-4">
        <div className="card max-w-md p-8 text-center">
          <p className="font-display text-2xl font-semibold">CardVerse Admin</p>
          <p className="mt-2 text-sm text-ink/60">หน้านี้สำหรับ Manager และ Admin เท่านั้น</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/sign-in" className="btn-primary">
              เข้าสู่ระบบ
            </Link>
            <Link href="/" className="btn-outline">
              กลับหน้าร้าน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications?.unread ?? 0;
  const roleLabel = session.role === "admin" ? "Admin" : "Manager";

  return (
    <div className="flex min-h-screen bg-[#f4f2ec]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="ปิดเมนู"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink/10 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-ink/10 px-5">
          <Image src="/logo.png" alt="CardVerse" width={32} height={32} className="rounded-lg" />
          <div>
            <p className="font-display text-lg font-semibold leading-tight">CardVerse</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">Admin Panel</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded-md p-1 text-ink/50 hover:bg-ink/5 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {ADMIN_MAIN_NAV.map((item) => (
            <SidebarLink
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        <div className="space-y-1 border-t border-ink/10 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink"
          >
            <ExternalLink size={18} />
            กลับหน้าร้าน
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink"
          >
            <UserCircle size={18} />
            บัญชีผู้ใช้
          </Link>
          <a
            href="https://github.com/danaiwut/Card_sell_Ecommerce"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink"
          >
            <HelpCircle size={18} />
            Help
          </a>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink/10 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-ink/60 hover:bg-ink/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <h1 className="font-display text-xl font-semibold sm:text-2xl">
            {getAdminTabLabel(activeTab)}
          </h1>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="relative hidden max-w-xs flex-1 sm:block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                className="h-10 w-56 rounded-full border border-ink/10 bg-[#faf8f3] pl-9 pr-4 text-sm outline-none focus:border-gold lg:w-72"
                placeholder="ค้นหาสินค้า, ออเดอร์..."
                readOnly
              />
            </div>

            <Link href="/notifications" className="relative rounded-full p-2 text-ink/55 hover:bg-ink/5 hover:text-ink">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1 pl-1 pr-3 transition hover:border-ink/20"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold">
                  {session.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight">{session.displayName}</span>
                  <span className="block text-[11px] text-ink/45">{roleLabel}</span>
                </span>
                <ChevronDown size={14} className="hidden text-ink/40 sm:block" />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    aria-label="ปิดเมนูโปรไฟล์"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-ink/10 bg-white py-1 shadow-card">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink/70 hover:bg-ink/[0.03]"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserCircle size={16} />
                      บัญชีผู้ใช้
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={16} />
                      ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: (typeof ADMIN_MAIN_NAV)[number];
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-gold text-white shadow-sm"
          : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink",
      )}
    >
      <Icon size={18} className={cn(active ? "text-white" : "text-ink/45")} />
      {item.label}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f2ec] text-sm text-ink/50">
          กำลังโหลด...
        </div>
      }
    >
      <AdminShellInner>{children}</AdminShellInner>
    </Suspense>
  );
}

export function useAdminTab(): AdminTab {
  const searchParams = useSearchParams();
  return resolveAdminTab(searchParams.get("tab"));
}
