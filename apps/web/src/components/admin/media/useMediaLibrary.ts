"use client";

import { useCallback, useEffect, useState } from "react";
import type { MediaAsset, MediaKind, MediaList } from "@waafa/shared";
import { markSignedOut } from "../sessionStore";

export type LibraryQuery = { q?: string; kind?: MediaKind; unused?: boolean; page?: number };

type Loaded = {
  /** The query these items answer; another query shows them dimmed while it loads. */
  key: string | null;
  status: "ready" | "failed";
  items: MediaAsset[];
  total: number;
  page: number;
  pageSize: number;
};

const NOTHING: Loaded = { key: null, status: "ready", items: [], total: 0, page: 1, pageSize: 48 };

/** Library files for a picker or the library page, fetched from the admin route (checked there, D202). */
export function useMediaLibrary(query: LibraryQuery, enabled = true) {
  const [loaded, setLoaded] = useState<Loaded>(NOTHING);
  const [version, setVersion] = useState(0);
  const { q, kind, unused, page } = query;
  const key = JSON.stringify([q ?? "", kind ?? "", unused ? 1 : 0, page ?? 1, version]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kind) params.set("kind", kind);
    if (unused) params.set("unused", "true");
    if (page && page > 1) params.set("page", String(page));
    fetch(`/secure-admin-control/api/media?${params.toString()}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) markSignedOut();
        if (!response.ok) throw new Error(String(response.status));
        const list = (await response.json()) as MediaList;
        setLoaded({ key, status: "ready", ...list });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name === "AbortError") return;
        setLoaded((current) => ({ ...current, key, status: "failed" }));
      });
    return () => controller.abort();
  }, [key, q, kind, unused, page, enabled]);

  /** Fetches again (after an upload, a crop or a delete). */
  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const status: "loading" | "ready" | "failed" = loaded.key === key ? loaded.status : "loading";
  return {
    status,
    items: loaded.items,
    total: loaded.total,
    page: loaded.page,
    pageSize: loaded.pageSize,
    reload,
  };
}
