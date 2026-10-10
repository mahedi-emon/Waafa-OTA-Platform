"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  RECENT_SEARCHES_KEY,
  parseRecentSearches,
  saveRecentSearch,
  type RecentSearch,
} from "@/lib/search/recentSearches";

const EMPTY: RecentSearch[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedList: RecentSearch[] = EMPTY;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(): RecentSearch[] {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(RECENT_SEARCHES_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = raw ? parseRecentSearches(raw) : EMPTY;
  }
  return cachedList;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENT_SEARCHES_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Recent searches from this browser (never sent anywhere), plus a saver that updates every card on the page. */
export function useRecentSearches(): [RecentSearch[], (entry: RecentSearch) => void] {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const save = useCallback((entry: RecentSearch) => {
    saveRecentSearch(storage(), entry);
    for (const listener of listeners) listener();
  }, []);
  return [list, save];
}
