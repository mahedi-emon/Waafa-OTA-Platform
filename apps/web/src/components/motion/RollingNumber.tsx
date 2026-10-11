"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "cn";

type RollingNumberProps = { value: number; className?: string };
type Shown = { value: number; previous: number | null; direction: number };

/**
 * A stepper value that rolls: the old number leaves and the new one enters, 8 px up when it grows and down when
 * it shrinks, 220 ms (MOTION.md "Traveller stepper"). CSS only (issue 91); under reduced motion the new number
 * fades in and the old one is hidden at once.
 */
function RollingNumber({ value, className }: RollingNumberProps) {
  const [shown, setShown] = useState<Shown>({ value, previous: null, direction: 1 });
  if (shown.value !== value) {
    setShown({ value, previous: shown.value, direction: value > shown.value ? 1 : -1 });
  }
  const slotStyle = {
    "--slot-from": `${shown.direction * 8}px`,
    "--slot-to": `${shown.direction * -8}px`,
    "--slot-duration": "220ms",
  } as CSSProperties;

  return (
    <span
      className={cn("relative inline-grid overflow-hidden tabular-nums", className)}
      style={slotStyle}
    >
      {shown.previous !== null ? (
        <span
          key={`out-${shown.previous}-${shown.value}`}
          aria-hidden="true"
          className="slot-out [grid-area:1/1]"
          onAnimationEnd={() => setShown((current) => ({ ...current, previous: null }))}
        >
          {shown.previous}
        </span>
      ) : null}
      <span
        key={`in-${shown.value}`}
        className={cn("[grid-area:1/1]", shown.previous !== null && "slot-in")}
      >
        {shown.value}
      </span>
    </span>
  );
}

export { RollingNumber };
