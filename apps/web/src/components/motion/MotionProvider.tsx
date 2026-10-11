"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** The DOM animation features arrive as a separate chunk, so they never weigh on the first load (#39). */
const loadFeatures = () => import("./motionFeatures").then((module) => module.default);

/**
 * Loads only the DOM animation features (~15 kB instead of the full bundle), asynchronously.
 * `strict` makes `motion.*` throw, so components must use the lightweight `m.*`.
 * `reducedMotion="user"` turns transform animations off when the OS asks for it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
