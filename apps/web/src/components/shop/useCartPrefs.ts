"use client";

import { useSyncExternalStore } from "react";

/*
 * The visitor's coupon code and delivery area, kept for the visit (sessionStorage) so the cart page and the checkout
 * show the same prices. Missing storage falls back to memory for the page.
 */

type Prefs = { couponCode: string; zoneId: string };

const KEY = "waafa:cart-prefs:v1";
const EMPTY: Prefs = { couponCode: "", zoneId: "" };
const listeners = new Set<() => void>();
let memory: Prefs | null = null;
let cachedRaw: string | null | undefined;
let cached: Prefs = EMPTY;

function parse(raw: string | null): Prefs {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as Partial<Prefs>;
    return {
      couponCode: typeof value.couponCode === "string" ? value.couponCode.slice(0, 24) : "",
      zoneId: typeof value.zoneId === "string" ? value.zoneId.slice(0, 40) : "",
    };
  } catch {
    return EMPTY;
  }
}

function read(): Prefs {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return memory ?? EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return memory ?? cached;
}

function write(next: Prefs) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    memory = null;
  } catch {
    memory = next;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCartPrefs() {
  const prefs = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ...prefs,
    setCouponCode: (couponCode: string) => write({ ...read(), couponCode }),
    setZoneId: (zoneId: string) => write({ ...read(), zoneId }),
  };
}
