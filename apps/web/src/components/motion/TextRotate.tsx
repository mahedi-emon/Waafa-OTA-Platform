"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "cn";
import { usePrefersReducedMotion } from "./reducedMotion";

type TextRotateProps = { words: string[]; intervalMs?: number; className?: string };

/**
 * Rotating word (MOTION.md "Rotating destination chip", after 21st.dev Text Rotate 657): every 3 s the word rises
 * out and the next rises in (opacity + y). Reduced motion shows the first word only. Screen readers get the whole
 * list once instead of a live-changing word.
 */
function TextRotate({ words, intervalMs = 3000, className }: TextRotateProps) {
  const reduce = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);
    return () => window.clearInterval(timer);
  }, [reduce, words.length, intervalMs]);

  return (
    <span className={cn("relative inline-grid overflow-hidden align-bottom", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={words[index]}
          aria-hidden="true"
          className="whitespace-nowrap [grid-area:1/1]"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[index]}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

export { TextRotate };
