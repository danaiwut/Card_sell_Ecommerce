"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function SignUpPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <Suspense fallback={<div className="text-sm text-ink/50">กำลังโหลด...</div>}>
        <LoginForm defaultMode="register" />
      </Suspense>
    </div>
  );
}
