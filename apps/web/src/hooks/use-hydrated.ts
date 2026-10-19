"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False on the server and while hydrating, true afterwards: for parts that should load only in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
