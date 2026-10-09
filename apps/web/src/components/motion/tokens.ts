import type { Transition } from "motion/react";

/** Motion tokens (MOTION.md §1). The same numbers live as CSS variables in globals.css. */
export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.3,
  page: 0.42,
  reveal: 0.56,
  countUp: 0.9,
} as const;

export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  standard: [0.2, 0, 0, 1],
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const SPRING = {
  tab: { type: "spring", stiffness: 500, damping: 38 },
  sheet: { type: "spring", stiffness: 380, damping: 34 },
  lift: { type: "spring", stiffness: 300, damping: 24 },
  pop: { type: "spring", stiffness: 600, damping: 22 },
} as const satisfies Record<string, Transition>;

/** Stagger between list items; only the first eight animate, the rest arrive with the eighth. */
export const STAGGER_STEP = 0.05;
export const STAGGER_MAX_ITEMS = 8;

/** Delay for the item at `index` in a staggered group (0-based), capped after eight items. */
export function staggerDelay(index: number, step: number = STAGGER_STEP): number {
  const safeIndex = Number.isFinite(index) && index > 0 ? Math.floor(index) : 0;
  return Math.min(safeIndex, STAGGER_MAX_ITEMS - 1) * step;
}

/** Scroll reveals trigger once, 6 % before the element reaches the bottom of the viewport. */
export const REVEAL_VIEWPORT = { once: true, margin: "0px 0px -6% 0px" } as const;
