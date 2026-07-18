"use client";

import { ClerkProvider } from "@clerk/nextjs";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkProviderShell({ children }: { children: React.ReactNode }) {
  if (!clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/account"
      afterSignUpUrl="/account"
    >
      {children}
    </ClerkProvider>
  );
}
