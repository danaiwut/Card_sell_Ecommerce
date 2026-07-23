"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>("/auth/forgot-password", { email }, false);
      setMessage(res.message);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ไม่สามารถส่งคำขอได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="font-display text-2xl font-semibold">ลืมรหัสผ่าน</h1>
      <p className="mt-1 text-sm text-ink/50">
        กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-ink/45">
        <Link href="/sign-in" className="font-semibold text-gold hover:underline">
          กลับไปเข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
