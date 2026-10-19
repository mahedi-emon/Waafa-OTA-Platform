"use client";

import { useSyncExternalStore } from "react";

/** True while the window is at least `pixels` wide (false on the server and while hydrating). */
export function useMinWidth(pixels: number): boolean {
  const query = `(min-width: ${pixels}px)`;
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
