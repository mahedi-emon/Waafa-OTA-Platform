import { useId } from "react";
import { cn } from "cn";

/**
 * Hero underlay (DESIGN.md signature 1): the W's flowing band with a silver edge that draws itself once.
 * Decorative and stretched to its container; under reduced motion the edge is simply there.
 */
function RibbonBand({ className }: { className?: string }) {
  const gradientId = `ribbon-band-${useId()}`;

  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none block h-full w-full", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#020D39" stopOpacity="0" />
          <stop offset="0.32" stopColor="#003FBE" stopOpacity="0.78" />
          <stop offset="0.7" stopColor="#0D8CEE" stopOpacity="0.8" />
          <stop offset="1" stopColor="#39CCE9" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        d="M0 176 C 300 176 470 74 780 66 C 1080 58 1200 122 1440 44 L 1440 84 C 1204 160 1080 102 780 110 C 470 118 300 216 0 216 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 176 C 300 176 470 74 780 66 C 1080 58 1200 122 1440 44"
        fill="none"
        stroke="#D7D3D0"
        strokeOpacity="0.85"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        className="animate-ribbon-draw [stroke-dasharray:2000] [stroke-dashoffset:2000] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
      />
    </svg>
  );
}

export { RibbonBand };
