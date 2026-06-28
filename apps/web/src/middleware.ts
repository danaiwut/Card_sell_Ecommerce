import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection.
 *
 * When Clerk is configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set), wire this
 * up with Clerk's `clerkMiddleware()` from `@clerk/nextjs/server` to protect
 * the /account and /admin route groups server-side. In demo mode (no keys)
 * protection is handled client-side via the dev session, so this is a no-op.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
