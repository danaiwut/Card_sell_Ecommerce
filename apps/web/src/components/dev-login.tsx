"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";

/**
 * Lightweight sign-in panel for local/demo use (Clerk fallback).
 * When Clerk keys are configured you would replace this with Clerk's
 * <SignIn/> component; the API accepts both Clerk tokens and this dev session.
 */
export function DevLogin() {
  const { loginAs } = useSession();
  const [name, setName] = useState("collector");

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="font-display text-2xl font-semibold">เข้าสู่ระบบ CardVerse</h1>
        <p className="mt-1 text-sm text-ink/50">
          เลือกบทบาทเพื่อทดลองใช้งาน (โหมดเดโม่ — ใช้ Clerk เมื่อมีคีย์)
        </p>
        <label className="mt-5 block text-xs font-semibold tracking-wider text-ink/50">
          ชื่อผู้ใช้
        </label>
        <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-5 grid gap-2">
          <button className="btn-primary" onClick={() => loginAs(name || "customer", "customer")}>
            เข้าสู่ระบบเป็น Customer
          </button>
          <button className="btn-outline" onClick={() => loginAs(name || "manager", "manager")}>
            เข้าสู่ระบบเป็น Manager
          </button>
          <button className="btn-outline" onClick={() => loginAs(name || "admin", "admin")}>
            เข้าสู่ระบบเป็น Admin
          </button>
        </div>
      </div>
    </div>
  );
}
