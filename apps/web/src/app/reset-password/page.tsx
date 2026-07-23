"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <Suspense fallback={<div className="text-sm text-ink/50">กำลังโหลด...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
