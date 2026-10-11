"use client";

import { useEffect, useState } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Header and tab-bar overlays load their sheet or popover code on first use (issue 91): `mounted` turns true on the
 * first open and stays true so close animations play; `load` warms the chunk once the browser is idle, so the first
 * tap opens without a network wait.
 */
function useLazyOverlay(load: () => Promise<unknown>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const idleWindow = window as IdleWindow;
    const warm = () => {
      void load().catch(() => undefined);
    };
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(warm, { timeout: 6000 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(warm, 3000);
    return () => window.clearTimeout(timer);
  }, [load]);

  function change(next: boolean) {
    if (next) setMounted(true);
    setOpen(next);
  }

  return { open, mounted, setOpen: change };
}

export { useLazyOverlay };
