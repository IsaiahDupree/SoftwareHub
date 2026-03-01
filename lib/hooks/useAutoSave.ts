"use client";

import { useEffect, useRef, useCallback } from "react";

export function useAutoSave<T>(
  key: string,
  data: T,
  options?: { debounceMs?: number; enabled?: boolean }
) {
  const { debounceMs = 2000, enabled = true } = options || {};
  const timeoutRef = useRef<NodeJS.Timeout>();

  const save = useCallback(() => {
    if (!enabled) return;
    try {
      localStorage.setItem(`autosave:${key}`, JSON.stringify(data));
    } catch {
      // localStorage may be full or unavailable
    }
  }, [key, data, enabled]);

  useEffect(() => {
    if (!enabled) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, debounceMs);
    return () => clearTimeout(timeoutRef.current);
  }, [save, debounceMs, enabled]);

  return {
    restore: (): T | null => {
      try {
        const saved = localStorage.getItem(`autosave:${key}`);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    },
    clear: () => {
      localStorage.removeItem(`autosave:${key}`);
    },
  };
}
