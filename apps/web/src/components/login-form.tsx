"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, setAuthToken } from "@/lib/api";

type Mode = "login" | "register";

export function LoginForm({ defaultMode = "login" }: { defaultMode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirect_url") || "/account";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, displayName: displayName || email.split("@")[0] };

      const res = await api.post<{ token: string }>(path, body, false);
      setAuthToken(res.token);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ไม่สามารถเข้าสู่ระบบได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="font-display text-2xl font-semibold">
        {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
      </h1>
      <p className="mt-1 text-sm text-ink/50">
        ใช้บัญชี CardVerse ของคุณ — ข้อมูลเก็บในระบบ local
      </p>

      <div className="mt-6 flex gap-2 rounded-lg bg-ink/5 p-1">
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : "text-ink/50"}`}
          onClick={() => setMode("login")}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : "text-ink/50"}`}
          onClick={() => setMode("register")}
        >
          สมัครสมาชิก
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <div>
            <label className="block text-xs font-semibold tracking-wider text-ink/50">ชื่อที่แสดง</label>
            <input
              className="input mt-1"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="เช่น น้องบอล"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold tracking-wider text-ink/50">อีเมล</label>
          <input
            className="input mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-wider text-ink/50">รหัสผ่าน</label>
          <input
            className="input mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 8 ตัว"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-ink/45">
        {mode === "login" ? (
          <>
            ยังไม่มีบัญชี?{" "}
            <Link href="/sign-up" className="font-semibold text-gold hover:underline">
              สมัครสมาชิก
            </Link>
          </>
        ) : (
          <>
            มีบัญชีแล้ว?{" "}
            <Link href="/sign-in" className="font-semibold text-gold hover:underline">
              เข้าสู่ระบบ
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
