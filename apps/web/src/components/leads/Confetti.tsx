import type { CSSProperties } from "react";

const PIECES = Array.from({ length: 14 }, (_, i) => ({
  left: `${6 + ((i * 37) % 88)}%`,
  dx: `${((i * 53) % 60) - 30}px`,
  rot: `${180 + ((i * 71) % 300)}deg`,
  delay: `${(i % 7) * 60}ms`,
  tone: ["bg-electric-600", "bg-sky-500", "bg-navy-900", "bg-gold-500"][i % 4],
  wide: i % 3 === 0,
}));

/**
 * Light confetti over a success card (MOTION.md signature moment "Boarding-pass success"): 14 pieces, one fall,
 * transform and opacity only; nothing renders under reduced motion. Decorative.
 */
function Confetti() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden motion-reduce:hidden"
    >
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className={`absolute top-0 ${piece.wide ? "h-1.5 w-3" : "h-2.5 w-1.5"} rounded-[2px] ${piece.tone} [animation:confetti-fall_1100ms_cubic-bezier(0.22,1,0.36,1)_both] opacity-0`}
          style={
            {
              left: piece.left,
              animationDelay: piece.delay,
              "--dx": piece.dx,
              "--rot": piece.rot,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

export { Confetti };
