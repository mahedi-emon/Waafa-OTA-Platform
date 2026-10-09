"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";
import { cn } from "cn";
import { formatGrouped } from "@waafa/shared";
import { usePrefersReducedMotion } from "./reducedMotion";
import { DURATION, EASE } from "./tokens";

type CountUpProps = {
  /** The real number to show. Only numbers the owner provides (no invented stats). */
  value: number;
  /** Formats each frame and the final value; defaults to Indian grouping (1,46,480). */
  format?: (value: number) => string;
  className?: string;
};

/**
 * Counts from 0 to `value` once when scrolled into view (900 ms, ease-out). The server HTML and
 * reduced-motion users get the final number. Frames are written to the DOM directly, not through React state.
 */
function CountUp({ value, format = formatGrouped, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -6% 0px" });
  const reduce = usePrefersReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduce || started.current) return;
    if (!inView) {
      node.textContent = format(0);
      return;
    }
    started.current = true;
    const controls = animate(0, value, {
      duration: DURATION.countUp,
      ease: EASE.out,
      onUpdate: (latest) => {
        node.textContent = format(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, format]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(value)}
    </span>
  );
}

export { CountUp };
