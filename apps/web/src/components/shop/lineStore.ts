"use client";

import { parseLines, type CartLine } from "@/lib/shop/cart";

const EMPTY: CartLine[] = [];

/**
 * A list of cart lines kept in localStorage and shared by every tab through the storage event (the cart, and since
 * issue 246 the "Saved for later" list). Storage can be missing or blocked (private windows); the list then lives for
 * the page only.
 */
export function createLineStore(key: string) {
  const listeners = new Set<() => void>();
  let memory: CartLine[] | null = null;
  let cachedRaw: string | null | undefined;
  let cachedLines: CartLine[] = EMPTY;

  function read(): CartLine[] {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return memory ?? EMPTY;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedLines = parseLines(raw);
    }
    return memory ?? cachedLines;
  }

  function write(lines: CartLine[]) {
    try {
      window.localStorage.setItem(key, JSON.stringify(lines));
      memory = null;
    } catch {
      memory = lines;
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe, empty: () => EMPTY };
}
