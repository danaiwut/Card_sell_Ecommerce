"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function SignInPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <Suspense fallback={<div className="text-sm text-ink/50">กำลังโหลด...</div>}>
        <LoginForm defaultMode="login" />
      </Suspense>
    </div>
  );
}
