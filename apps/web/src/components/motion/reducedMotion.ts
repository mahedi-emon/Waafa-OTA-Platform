"use client";

import { useSyncExternalStore } from "react";
import type { Transition, Variants } from "motion/react";

/** Under prefers-reduced-motion, movement becomes this short fade (CLAUDE.md rule). */
export const REDUCED_FADE: Transition = { duration: 0.15, ease: "linear" };

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * True when the user asked the OS for reduced motion. False during SSR. Reads the media query directly, so public
 * components that only need this flag do not pull the animation library into the first load (issue 91).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/**
 * Returns variants that rise into place, or a plain 150 ms fade under reduced motion.
 * Only transform and opacity are animated.
 */
export function useRiseVariants(distance = 16): Variants {
  const reduce = usePrefersReducedMotion();
  if (reduce) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: REDUCED_FADE },
    };
  }
  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 30 },
    },
  };
}

/** Picks the reduced-motion fade over any transition when the user asked for it. */
export function useSafeTransition(transition: Transition): Transition {
  return usePrefersReducedMotion() ? REDUCED_FADE : transition;
}
