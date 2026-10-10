"use client";

import { useEffect, useState } from "react";

type Result<T> = { query: string; items: T[]; error: boolean };

/**
 * Typed-query suggestions from a search route handler (`?q=`), debounced 150 ms and aborted when the query
 * changes. Returns null items until the first answer for the current query arrives.
 */
export function useRemoteSuggestions<T>(endpoint: string, query: string) {
  const q = query.trim();
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`${endpoint}?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json() as Promise<{ items: T[] }>;
        })
        .then((body) => setResult({ query: q, items: body.items, error: false }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          void error;
          setResult({ query: q, items: [], error: true });
        });
    }, 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, q]);

  const current = q && result?.query === q ? result : null;
  return {
    items: current?.items ?? null,
    loading: Boolean(q) && current === null,
    error: current?.error ?? false,
  };
}
