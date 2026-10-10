"use client";

import { useSyncExternalStore } from "react";

/*
 * Recently viewed products (FR-SHOP-01/04), newest first, kept in this browser only. A snapshot of the card fields is
 * stored so the row renders without another request; prices refresh when the product page is opened again.
 */

export type ViewedProduct = {
  slug: string;
  title: string;
  brand: string;
  price: number;
  image?: { src: string; alt: string };
};

const KEY = "waafa:viewed:v1";
const MAX = 12;
const EMPTY: ViewedProduct[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: ViewedProduct[] = EMPTY;

function read(): ViewedProduct[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const value: unknown = raw ? JSON.parse(raw) : [];
      cached = Array.isArray(value)
        ? value.filter(
            (item): item is ViewedProduct =>
              typeof item === "object" &&
              item !== null &&
              typeof item.slug === "string" &&
              typeof item.title === "string",
          )
        : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached;
}

function write(items: ViewedProduct[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage blocked: the row simply stays empty.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordView(product: ViewedProduct) {
  write([product, ...read().filter((item) => item.slug !== product.slug)].slice(0, MAX));
}

export function useRecentlyViewed() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return { items, clear: () => write([]) };
}
