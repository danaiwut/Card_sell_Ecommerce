"use client";

import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <Suspense fallback={<div className="text-sm text-ink/50">กำลังโหลด...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
