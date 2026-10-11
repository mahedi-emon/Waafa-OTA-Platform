"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "cn";

type CardFxProps = {
  children: ReactNode;
  /** The card leans up to 4° towards the pointer (destinations, package grid). */
  tilt?: boolean;
  /** A soft electric glow follows the pointer (offers, visa and package cards). */
  spotlight?: boolean;
  /** Match the card's radius so the glow stays inside it, e.g. "rounded-2xl". */
  className?: string;
};

const MAX_TILT_DEG = 4;

/**
 * Spotlight and 3D tilt for cards (HANDOFF effects: spotlight card and tilt card, rebuilt on our tokens). Mouse
 * pointers only, so touch devices and the server render the plain card; the tilt stays off under reduced motion.
 * Writes a CSS variable and a transform straight to the element once per frame: no React re-render, compositor
 * work only.
 */
function CardFx({ children, tilt = false, spotlight = true, className }: CardFxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty("--spot-x", `${(x * 100).toFixed(1)}%`);
      element.style.setProperty("--spot-y", `${(y * 100).toFixed(1)}%`);
      if (tilt && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rotateX = ((0.5 - y) * MAX_TILT_DEG * 2).toFixed(2);
        const rotateY = ((x - 0.5) * MAX_TILT_DEG * 2).toFixed(2);
        element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });
  }

  function leave() {
    cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn(
        "group/fx relative h-full transition-transform duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
    >
      {children}
      {spotlight ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 spotlight-layer pointer-fine:group-hover/fx:opacity-100"
        />
      ) : null}
    </div>
  );
}

export { CardFx };
