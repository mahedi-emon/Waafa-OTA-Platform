"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ContentOption } from "@waafa/shared";

export type OptionsState = {
  status: "idle" | "loading" | "ready" | "failed";
  items: ContentOption[];
};

const IDLE: OptionsState = { status: "idle", items: [] };
/** Lists reload when a picker opens after this long, so a record created in another tab shows up. */
const FRESH_FOR = 30_000;

const cache = new Map<string, OptionsState & { at: number }>();
const pending = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

/** Moves on every change, so a picker reading several lists re-renders once something arrives. */
let version = 0;

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

/** Loads one list's choices (once per page, again when stale or forced). */
export function loadOptions(key: string, force = false): Promise<void> {
  const known = cache.get(key);
  if (!force && known && known.status === "ready" && Date.now() - known.at < FRESH_FOR)
    return Promise.resolve();
  const running = pending.get(key);
  if (running) return running;
  cache.set(key, {
    status: known?.items.length ? "ready" : "loading",
    items: known?.items ?? [],
    at: known?.at ?? 0,
  });
  emit();
  const job = fetch(`/secure-admin-control/api/content/${encodeURIComponent(key)}/options`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(String(response.status));
      const body = (await response.json()) as { items: ContentOption[] };
      cache.set(key, { status: "ready", items: body.items, at: Date.now() });
    })
    .catch(() => {
      cache.set(key, { status: "failed", items: cache.get(key)?.items ?? [], at: 0 });
    })
    .finally(() => {
      pending.delete(key);
      emit();
    });
  pending.set(key, job);
  return job;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** One list's choices as loaded so far (read during a render that uses `useOptionsOf`). */
export function readOptions(key: string): OptionsState {
  return cache.get(key) ?? IDLE;
}

/** Loads several lists (the link picker's groups) and re-renders as each arrives; read them with `readOptions`. */
export function useOptionsOf(keys: readonly string[]): number {
  const joined = keys.join("|");
  useEffect(() => {
    for (const key of joined ? joined.split("|") : []) void loadOptions(key);
  }, [joined]);
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
}

/** The choices of one list for a picker, loading them on first use. */
export function useContentOptions(key: string | undefined): OptionsState {
  useEffect(() => {
    if (key) void loadOptions(key);
  }, [key]);
  return useSyncExternalStore(
    subscribe,
    () => (key ? (cache.get(key) ?? IDLE) : IDLE),
    () => IDLE,
  );
}
