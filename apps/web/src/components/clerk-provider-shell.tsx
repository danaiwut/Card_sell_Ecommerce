"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-config";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { Providers } from "@/components/providers";

export function ClerkProviderShell({ children }: { children: React.ReactNode }) {
  const publishableKey = getClerkPublishableKey();

  if (!publishableKey) {
    return <Providers clerkEnabled={false}>{children}</Providers>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/account"
      afterSignUpUrl="/account"
      appearance={clerkAuthAppearance}
    >
      <Providers clerkEnabled>{children}</Providers>
    </ClerkProvider>
  );
}
