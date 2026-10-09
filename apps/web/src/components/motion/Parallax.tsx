"use client";

import { useRef, type ReactNode } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { usePrefersReducedMotion } from "./reducedMotion";
import { useDesktopPointer } from "./useDesktopPointer";

type ParallaxProps = {
  children: ReactNode;
  /** Pixels the content drifts over the element's pass through the viewport (default 48). */
  distance?: number;
  className?: string;
};

/**
 * Slow vertical drift for the hero ribbon only (MOTION.md: parallax only in the hero). Desktop pointers only;
 * phones and reduced-motion users get a still layer. Driven by a motion value, so React never re-renders.
 */
function Parallax({ children, distance = 48, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const desktop = useDesktopPointer();
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-distance / 2, distance / 2]);

  if (!desktop || reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <m.div ref={ref} className={className} style={{ y }}>
      {children}
    </m.div>
  );
}

export { Parallax };
