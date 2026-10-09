import { cn } from "cn";

type DrawCheckProps = {
  /** Diameter in px (default 72). */
  size?: number;
  className?: string;
};

/**
 * Success check (MOTION.md): the circle draws in 700 ms, then the tick in 450 ms. CSS only, so it plays as
 * soon as the success screen paints; under reduced motion both strokes are already drawn.
 * Decorative: the success heading next to it says what happened.
 */
function DrawCheck({ size = 72, className }: DrawCheckProps) {
  const stroke =
    "fill-none [stroke-linecap:round] [stroke-linejoin:round] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]";

  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 text-success-600", className)}
    >
      <circle
        cx="36"
        cy="36"
        r="32"
        stroke="currentColor"
        strokeWidth="3"
        className={cn(
          stroke,
          "origin-center -rotate-90 animate-draw-once [stroke-dasharray:202] [stroke-dashoffset:202]",
        )}
      />
      <path
        d="M23 37.5 L32 46 L50 27"
        stroke="currentColor"
        strokeWidth="4.5"
        className={cn(stroke, "animate-draw-tick [stroke-dasharray:44] [stroke-dashoffset:44]")}
      />
    </svg>
  );
}

export { DrawCheck };
