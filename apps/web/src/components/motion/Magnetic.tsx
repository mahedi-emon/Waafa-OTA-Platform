"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "cn";

const PULL = 6;
const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

type MagneticProps = { children: ReactNode; className?: string };

/**
 * Magnetic primary buttons (MOTION.md §8): on desktop pointers the button leans up to 6 px towards the pointer and
 * springs back on leave. Transform only; off on touch screens and under reduced motion.
 */
function Magnetic({ children, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  function move(event: PointerEvent<HTMLSpanElement>) {
    const element = ref.current;
    if (!element || !window.matchMedia(QUERY).matches) return;
    const box = element.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 2 * PULL;
    const y = ((event.clientY - box.top) / box.height - 0.5) * 2 * PULL;
    element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }

  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn(
        "inline-flex transition-transform duration-300 ease-[cubic-bezier(0.34,1.36,0.64,1)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Magnetic };
