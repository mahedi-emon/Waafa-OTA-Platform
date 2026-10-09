"use client";

import { useEffect, useState, type ReactNode } from "react";
import { m } from "motion/react";
import { REDUCED_FADE, usePrefersReducedMotion } from "./reducedMotion";
import { DURATION, EASE } from "./tokens";

/** Set after the first page has mounted in this tab; later mounts are client-side navigations. */
let hasMountedOnce = false;

/**
 * Page enter (MOTION.md): fade + 8 px rise in 420 ms on client-side navigations, used in `template.tsx`.
 * The first load is never animated, so the server-rendered page (and its LCP element) shows at once.
 */
function PageTransition({ children }: { children: ReactNode }) {
  const reduce = usePrefersReducedMotion();
  const [animate] = useState(() => hasMountedOnce);

  useEffect(() => {
    hasMountedOnce = true;
  }, []);

  if (!animate) {
    return <>{children}</>;
  }

  return (
    <m.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={reduce ? REDUCED_FADE : { duration: DURATION.page, ease: EASE.out }}
    >
      {children}
    </m.div>
  );
}

export { PageTransition };
