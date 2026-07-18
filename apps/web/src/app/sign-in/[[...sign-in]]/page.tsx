"use client";

import { SignIn } from "@clerk/nextjs";
import { DevLogin } from "@/components/dev-login";
import { isClerkEnabled } from "@/lib/clerk-config";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      {isClerkEnabled() ? <SignIn appearance={clerkAuthAppearance} /> : <DevLogin />}
    </div>
  );
}
