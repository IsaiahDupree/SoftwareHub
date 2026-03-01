interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.data as T;
  }

  const data = await queryFn();
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data;
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  Array.from(cache.keys()).forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

// Periodic cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(cache.entries()).forEach(([key, entry]) => {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  });
}, 10 * 60 * 1000);
