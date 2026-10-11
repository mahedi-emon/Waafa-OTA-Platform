"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { onToasterRequest } from "./notify";

const ToasterReady = dynamic(() => import("./ToasterReady").then((mod) => mod.ToasterReady), {
  ssr: false,
});

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * The public toaster, loaded after the page is interactive (idle callback, at most 4 s) or as soon as `notify`
 * asks for it, so the toast library stays out of the first load (issue 91).
 */
function LazyToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const show = () => setMounted(true);
    const unsubscribe = onToasterRequest(show);
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(show, { timeout: 4000 });
      return () => {
        unsubscribe();
        idleWindow.cancelIdleCallback?.(handle);
      };
    }
    const timer = window.setTimeout(show, 2500);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [mounted]);

  return mounted ? <ToasterReady /> : null;
}

export { LazyToaster };
