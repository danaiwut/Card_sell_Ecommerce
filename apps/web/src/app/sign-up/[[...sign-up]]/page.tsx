"use client";

import { SignUp } from "@clerk/nextjs";
import { DevLogin } from "@/components/dev-login";
import { isClerkEnabled } from "@/lib/clerk-config";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      {isClerkEnabled() ? <SignUp appearance={clerkAuthAppearance} /> : <DevLogin />}
    </div>
  );
}
