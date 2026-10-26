"use client";

import { useRef } from "react";

/**
 * One request at a time, with one idempotency key per request (issue 236). Kept in a ref, not state: with validation
 * loading on first use, both taps of a double tap reach the submit handler before React re-renders, so both must see
 * the busy flag and the key at once. A retry reuses the key; after a success the next request takes a new one.
 */
export function useSubmitOnce() {
  const state = useRef<{ busy: boolean; key: string | null }>({ busy: false, key: null });
  return {
    /** Marks a request as running and returns its idempotency key, or null when one is already running. */
    start(): string | null {
      if (state.current.busy) return null;
      state.current.busy = true;
      state.current.key ??= crypto.randomUUID();
      return state.current.key;
    },
    /** The next request takes a new key: after a success, or a refusal that is final for this attempt. */
    renew() {
      state.current.key = null;
    },
    /** The request ended, accepted or not. */
    finished() {
      state.current.busy = false;
    },
  };
}
