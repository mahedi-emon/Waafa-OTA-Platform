"use client";

import { useSyncExternalStore } from "react";

/*
 * Whether the staff session has ended (D0 R2). The inbox poller notices within 30 s; an editor's save notices at
 * once. Either way the frame shows "Your session has ended" before anyone loses typed work.
 */

let signedOut = false;
const listeners = new Set<() => void>();

export function markSignedOut(): void {
  if (signedOut) return;
  signedOut = true;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True once the session has ended (until the next page load). */
export function useSignedOut(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => signedOut,
    () => false,
  );
}
