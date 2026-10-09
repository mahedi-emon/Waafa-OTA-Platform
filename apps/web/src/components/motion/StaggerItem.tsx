"use client";

import type { ReactNode } from "react";
import { m, type Variants } from "motion/react";
import { REDUCED_FADE, usePrefersReducedMotion } from "./reducedMotion";
import { DURATION, EASE, staggerDelay } from "./tokens";

const tags = { div: m.div, li: m.li, article: m.article } as const;

type StaggerItemProps = {
  children: ReactNode;
  /** Position in the group (0-based); drives the 50 ms step, capped after eight items. */
  index: number;
  as?: keyof typeof tags;
  className?: string;
};

/** One item in a Stagger group: rises 16 px and fades in after `staggerDelay(index)`. */
function StaggerItem({ children, index, as = "div", className }: StaggerItemProps) {
  const reduce = usePrefersReducedMotion();
  const Tag = tags[as];

  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, shown: { opacity: 1, transition: REDUCED_FADE } }
    : {
        hidden: { opacity: 0, y: 16 },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.reveal, ease: EASE.out, delay: staggerDelay(index) },
        },
      };

  return (
    <Tag data-reveal="" className={className} variants={variants}>
      {children}
    </Tag>
  );
}

export { StaggerItem };
