const PRODUCTION_API_ORIGIN = "https://cardverse-api-production.up.railway.app";

function isBrokenEnv(value: string | undefined): boolean {
  return !value || value.includes("[") || value.includes("\uFFFD");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Server-side API origin — calls Railway directly in production (no Vercel proxy hop). */
export function getServerApiBaseUrl(): string {
  const direct = process.env.CARDVERSE_API_ORIGIN ?? process.env.API_URL;
  if (direct?.startsWith("http")) return direct.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") return PRODUCTION_API_ORIGIN;

  const env = process.env.NEXT_PUBLIC_API_URL;
  if (!isBrokenEnv(env)) return env!;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/backend`;
  }

  return "http://localhost:3000/backend";
}

/** Browser production calls Railway directly (skips Vercel /backend proxy hop). */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && !isLocalHost(window.location.hostname)) {
    return PRODUCTION_API_ORIGIN;
  }

  const env = process.env.NEXT_PUBLIC_API_URL;
  if (!isBrokenEnv(env)) return env!;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/backend`;
  }

  return "http://localhost:3000/backend";
}

export function getWsBaseUrl(): string {
  if (typeof window !== "undefined" && !isLocalHost(window.location.hostname)) {
    return PRODUCTION_API_ORIGIN;
  }

  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (!isBrokenEnv(env)) return env!;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
