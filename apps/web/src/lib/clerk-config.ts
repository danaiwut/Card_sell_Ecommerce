const PRODUCTION_CLERK_PUBLISHABLE_KEY =
  "pk_test_YW1hemVkLW9hcmZpc2gtMTQuY2xlcmsuYWNjb3VudHMuZGV2JA";

function isBrokenEnv(value: string | undefined): boolean {
  return !value || value.includes("[") || value.includes("\uFFFD");
}

export function getClerkPublishableKey(): string | undefined {
  const env = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!isBrokenEnv(env)) return env;

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return PRODUCTION_CLERK_PUBLISHABLE_KEY;
    }
  }

  if (process.env.VERCEL) {
    return PRODUCTION_CLERK_PUBLISHABLE_KEY;
  }

  return undefined;
}

export function isClerkEnabled(): boolean {
  return Boolean(getClerkPublishableKey());
}
