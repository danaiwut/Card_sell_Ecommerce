type CacheEntry<T> = { value: T; expiresAt: number };

export function createResponseCache<T>(ttlMs: number) {
  let entry: CacheEntry<T> | null = null;

  return {
    async get(fetcher: () => Promise<T>): Promise<T> {
      if (entry && Date.now() < entry.expiresAt) {
        return entry.value;
      }
      const value = await fetcher();
      entry = { value, expiresAt: Date.now() + ttlMs };
      return value;
    },
  };
}

export function createKeyedResponseCache<T>(ttlMs: number, maxEntries = 200) {
  const cache = new Map<string, CacheEntry<T>>();

  return {
    async get(key: string, fetcher: () => Promise<T>): Promise<T> {
      const entry = cache.get(key);
      if (entry && Date.now() < entry.expiresAt) {
        return entry.value;
      }
      const value = await fetcher();
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      if (cache.size > maxEntries) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      return value;
    },
  };
}
