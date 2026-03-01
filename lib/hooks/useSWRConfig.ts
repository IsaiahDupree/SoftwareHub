"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: () => Promise<void>;
}

const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds dedup

export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!!url);

  const fetchData = useCallback(async () => {
    if (!url) return;

    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data as T);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      apiCache.set(url, { data: json, timestamp: Date.now() });
      setData(json);
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, mutate: fetchData };
}

export function useApiWithAuth<T>(url: string | null): UseApiResult<T> {
  return useApi<T>(url);
}
