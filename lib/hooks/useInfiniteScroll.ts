"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options?: { threshold?: number }
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const observerRef = useRef<IntersectionObserver>();
  const { threshold = 0.5 } = options || {};

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const result = await fetchFn(pageRef.current);
      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      pageRef.current++;
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, loading, hasMore]);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            loadMore();
          }
        },
        { threshold }
      );
      if (node) observerRef.current.observe(node);
    },
    [loadMore, hasMore, loading, threshold]
  );

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading, hasMore, sentinelRef };
}
