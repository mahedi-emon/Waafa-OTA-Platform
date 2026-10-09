"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";
import { REDUCED_FADE, usePrefersReducedMotion } from "./reducedMotion";
import { DURATION, EASE, REVEAL_VIEWPORT } from "./tokens";

const tags = { div: m.div, section: m.section, article: m.article, li: m.li, ul: m.ul } as const;

type RevealProps = {
  children: ReactNode;
  as?: keyof typeof tags;
  /** Delay in seconds, e.g. from `staggerDelay(index)` when items are not inside a Stagger. */
  delay?: number;
  className?: string;
};

/**
 * Scroll reveal (MOTION.md): rises 16 px and fades in once, 560 ms. Never use it above the fold.
 * `data-reveal` lets the <noscript> and print rules force the content visible.
 */
function Reveal({ children, as = "div", delay = 0, className }: RevealProps) {
  const reduce = usePrefersReducedMotion();
  const Tag = tags[as];

  return (
    <Tag
      data-reveal=""
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={reduce ? REDUCED_FADE : { duration: DURATION.reveal, ease: EASE.out, delay }}
    >
      {children}
    </Tag>
  );
}

export { Reveal };
