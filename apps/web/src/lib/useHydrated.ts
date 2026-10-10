"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** false while prerendering and hydrating, true right after hydration (no effect, no extra state). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
