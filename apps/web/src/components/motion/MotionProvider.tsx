"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Loads only the DOM animation features (~15 kB instead of the full bundle).
 * `strict` makes `motion.*` throw, so components must use the lightweight `m.*`.
 * `reducedMotion="user"` turns transform animations off when the OS asks for it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
