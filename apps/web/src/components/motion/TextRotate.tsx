"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { usePrefersReducedMotion } from "./reducedMotion";

type TextRotateProps = { words: string[]; intervalMs?: number; className?: string };

/**
 * Rotating word (MOTION.md "Rotating destination chip", after 21st.dev Text Rotate 657): every 3 s the word rises
 * out and the next rises in (opacity + y), in CSS so the hero needs no animation library (issue 91). Reduced motion
 * shows the first word only. Screen readers get the whole list once instead of a live-changing word.
 */
function TextRotate({ words, intervalMs = 3000, className }: TextRotateProps) {
  const reduce = usePrefersReducedMotion();
  const [slot, setSlot] = useState<{ index: number; previous: number | null }>({
    index: 0,
    previous: null,
  });

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const timer = window.setInterval(
      () => setSlot(({ index }) => ({ index: (index + 1) % words.length, previous: index })),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [reduce, words.length, intervalMs]);

  const index = slot.index < words.length ? slot.index : 0;
  const previous = slot.previous !== null && slot.previous < words.length ? slot.previous : null;

  return (
    <span className={cn("relative inline-grid overflow-hidden align-bottom", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      {previous !== null ? (
        <span
          key={`out-${previous}-${index}`}
          aria-hidden="true"
          className="slot-out whitespace-nowrap [grid-area:1/1]"
          onAnimationEnd={() => setSlot((current) => ({ ...current, previous: null }))}
        >
          {words[previous]}
        </span>
      ) : null}
      <span
        key={`in-${index}`}
        aria-hidden="true"
        className={cn("whitespace-nowrap [grid-area:1/1]", previous !== null && "slot-in")}
      >
        {words[index]}
      </span>
    </span>
  );
}

export { TextRotate };
