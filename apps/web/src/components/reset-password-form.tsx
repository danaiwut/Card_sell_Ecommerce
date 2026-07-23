"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, setAuthToken } from "@/lib/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tokenFromUrl) {
      setError("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ token: string }>(
        "/auth/reset-password",
        { token: tokenFromUrl, password },
        false,
      );
      setAuthToken(res.token);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ไม่สามารถตั้งรหัสผ่านใหม่ได้");
    } finally {
      setLoading(false);
    }
  }

  if (!tokenFromUrl) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">ลิงก์ไม่ถูกต้อง</h1>
        <p className="mt-2 text-sm text-ink/50">ลิงก์รีเซ็ตรหัสผ่านหายไปหรือไม่ครบถ้วน</p>
        <Link href="/forgot-password" className="btn-primary mt-6 inline-block">
          ขอลิงก์ใหม่
        </Link>
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="font-display text-2xl font-semibold">ตั้งรหัสผ่านใหม่</h1>
      <p className="mt-1 text-sm text-ink/50">กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold tracking-wider text-ink/50">
            รหัสผ่านใหม่
          </label>
          <input
            className="input mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 8 ตัว"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-wider text-ink/50">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            className="input mt-1"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="พิมพ์อีกครั้ง"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
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
