import "server-only";
import { getServerApiBaseUrl } from "./env";

export class ServerFetchError extends Error {
  constructor(
    public status: number,
    path: string,
  ) {
    super(`API ${status}: ${path}`);
    this.name = "ServerFetchError";
  }
}

type FetchPublicOptions = {
  revalidate?: number | false;
  tags?: string[];
};

/** Cached public GET for Server Components (ISR). */
export async function fetchPublic<T>(
  path: string,
  options: FetchPublicOptions = {},
): Promise<T> {
  const { revalidate = 60, tags } = options;
  const url = `${getServerApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    next: { revalidate, tags },
  });

  if (!res.ok) {
    throw new ServerFetchError(res.status, path);
  }

  return res.json() as Promise<T>;
}

/** Safe fetch — returns null on 404 instead of throwing. */
export async function fetchPublicOrNull<T>(
  path: string,
  options?: FetchPublicOptions,
): Promise<T | null> {
  try {
    return await fetchPublic<T>(path, options);
  } catch (err) {
    if (err instanceof ServerFetchError && err.status === 404) return null;
    throw err;
  }
}
