"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "cn";

type RollingNumberProps = { value: number; className?: string };

/**
 * A stepper value that rolls: the old number leaves and the new one enters, 8 px up when it grows and down when
 * it shrinks, 220 ms (MOTION.md "Traveller stepper"). Under reduced motion MotionConfig drops the movement.
 */
function RollingNumber({ value, className }: RollingNumberProps) {
  const [shown, setShown] = useState({ value, direction: 1 });
  if (shown.value !== value) setShown({ value, direction: value > shown.value ? 1 : -1 });
  const direction = shown.direction;

  return (
    <span className={cn("relative inline-grid overflow-hidden tabular-nums", className)}>
      <AnimatePresence initial={false} custom={direction}>
        <m.span
          key={value}
          custom={direction}
          className="[grid-area:1/1]"
          initial={{ y: direction * 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -8, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

export { RollingNumber };
