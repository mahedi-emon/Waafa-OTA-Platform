"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * A per-device convenience kept in localStorage (folded sidebar groups, the bell's "seen" time). Server render and
 * hydration use the fallback; the stored value takes over after hydration without a setState-in-effect. Storage that
 * throws (private mode, blocked site data) simply keeps the fallback.
 */

const listeners = new Map<string, Set<() => void>>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

export function useStoredValue(key: string, fallback: string): [string, (next: string) => void] {
  const subscribe = useCallback(
    (listener: () => void) => {
      const set = listeners.get(key) ?? new Set();
      set.add(listener);
      listeners.set(key, set);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );
  const value = useSyncExternalStore(
    subscribe,
    () => read(key) ?? fallback,
    () => fallback,
  );
  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Not saved on this device; the value still applies until the page reloads.
      }
      notify(key);
    },
    [key],
  );
  return [value, setValue];
}
