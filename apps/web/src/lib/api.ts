import { isClerkEnabled } from "./clerk-config";
import { getApiBaseUrl } from "./env-urls";

export interface DevSession {
  userId: string;
  role: "customer" | "manager" | "admin";
}

const DEV_KEY = "cv_dev_session";

export function getDevSession(): DevSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEV_KEY);
  return raw ? (JSON.parse(raw) as DevSession) : null;
}

export function setDevSession(session: DevSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(DEV_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(DEV_KEY);
  window.dispatchEvent(new Event("cv-session-change"));
}

type TokenProvider = () => Promise<string | null>;

let authTokenProvider: TokenProvider | null = null;

/** Register Clerk getToken from a React component (preferred over window.Clerk). */
export function setAuthTokenProvider(provider: TokenProvider | null) {
  authTokenProvider = provider;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    if (authTokenProvider) {
      try {
        const token = await authTokenProvider();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        /* ignore */
      }
    }
    if (!headers.Authorization) {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        try {
          const token = await clerk.session.getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          /* ignore */
        }
      }
    }
    // Dev fallback session only when Clerk is not configured.
    if (!headers.Authorization && !isClerkEnabled()) {
      const dev = getDevSession();
      if (dev) {
        headers["x-dev-user-id"] = dev.userId;
        headers["x-dev-role"] = dev.role;
      }
    }
  }
  return headers;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) Object.assign(finalHeaders, await authHeaders());

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, auth }),
  del: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE", auth }),
};

export { getApiBaseUrl as API_URL };
