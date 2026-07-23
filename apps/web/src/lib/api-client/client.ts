import { getApiBaseUrl } from "./env";

const AUTH_TOKEN_KEY = "cv_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  else window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event("cv-session-change"));
}

type TokenProvider = () => Promise<string | null>;

let authTokenProvider: TokenProvider | null = null;

export function setAuthTokenProvider(provider: TokenProvider | null) {
  authTokenProvider = provider;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (typeof window === "undefined") return headers;

  if (authTokenProvider) {
    try {
      const token = await authTokenProvider();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      /* ignore */
    }
  }

  if (!headers.Authorization) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
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
    ...(auth ? { cache: "no-store" } : {}),
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
