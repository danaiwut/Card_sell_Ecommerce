"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

/** Auth gate for pages that require a signed-in user. */
export function AuthGate() {
  return (
    <div className="container-page py-16">
      <Suspense fallback={<div className="text-center text-sm text-ink/50">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

/** @deprecated use AuthGate */
export const DevLogin = AuthGate;
