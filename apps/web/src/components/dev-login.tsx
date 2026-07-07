"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { useSession } from "@/lib/session";
import { isClerkEnabled } from "@/lib/clerk-config";

/**
 * Auth gate for account pages.
 * Uses Clerk when keys are configured; otherwise falls back to local dev session.
 */
export function DevLogin() {
  const { loginAs, isLoaded } = useSession();

  if (isClerkEnabled()) {
    if (!isLoaded) {
      return (
        <div className="container-page py-16 text-center text-sm text-ink/50">
          กำลังโหลด...
        </div>
      );
    }

    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <SignIn routing="hash" signUpUrl="/sign-up" />
      </div>
    );
  }

  return <DevSessionLogin onLogin={loginAs} />;
}

function DevSessionLogin({
  onLogin,
}: {
  onLogin: (userId: string, role: "customer" | "manager" | "admin") => void;
}) {
  const [name, setName] = useState("collector");

  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-md p-8">
        <h1 className="font-display text-2xl font-semibold">เข้าสู่ระบบ CardVerse</h1>
        <p className="mt-1 text-sm text-ink/50">
          โหมดเดโม่ใน localhost — ใส่ Clerk keys ใน `.env` เพื่อใช้ login จริง
        </p>
        <label className="mt-5 block text-xs font-semibold tracking-wider text-ink/50">
          ชื่อผู้ใช้
        </label>
        <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-5 grid gap-2">
          <button className="btn-primary" onClick={() => onLogin(name || "customer", "customer")}>
            เข้าสู่ระบบเป็น Customer
          </button>
          <button className="btn-outline" onClick={() => onLogin(name || "manager", "manager")}>
            เข้าสู่ระบบเป็น Manager
          </button>
          <button className="btn-outline" onClick={() => onLogin(name || "admin", "admin")}>
            เข้าสู่ระบบเป็น Admin
          </button>
        </div>
      </div>
    </div>
  );
}
