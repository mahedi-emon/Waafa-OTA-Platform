"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Set after the first page has mounted in this tab; later mounts are client-side navigations. */
let hasMountedOnce = false;

/**
 * Page enter (MOTION.md): fade + 8 px rise in 420 ms on client-side navigations, used in `template.tsx`; a 150 ms
 * fade under reduced motion. The first load is never animated, so the server-rendered page (and its LCP element)
 * shows at once. CSS only, so no animation library loads with every page (issue 91).
 */
function PageTransition({ children }: { children: ReactNode }) {
  const [animate] = useState(() => hasMountedOnce);

  useEffect(() => {
    hasMountedOnce = true;
  }, []);

  if (!animate) {
    return <>{children}</>;
  }

  return <div className="page-enter">{children}</div>;
}

export { PageTransition };
