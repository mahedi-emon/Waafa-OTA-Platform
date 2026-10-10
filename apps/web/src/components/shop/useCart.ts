"use client";

import { useSyncExternalStore } from "react";
import {
  addLine,
  cartCount,
  parseLines,
  removeLine,
  setLineQty,
  type CartLine,
} from "@/lib/shop/cart";

/*
 * Guest cart in localStorage (FR-SHOP-06: carts persist across visits), shared by every tab through the storage
 * event. Storage can be missing or blocked (private windows); the cart then lives for the page only.
 */

const KEY = "waafa:cart:v1";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let memory: CartLine[] | null = null;
let cachedRaw: string | null | undefined;
let cachedLines: CartLine[] = EMPTY;

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
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
    window.localStorage.setItem(KEY, JSON.stringify(lines));
    memory = null;
  } catch {
    memory = lines;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    lines,
    count: cartCount(lines),
    add: (line: CartLine) => write(addLine(read(), line)),
    setQty: (variantId: string, qty: number) => write(setLineQty(read(), variantId, qty)),
    remove: (variantId: string) => write(removeLine(read(), variantId)),
  };
}
