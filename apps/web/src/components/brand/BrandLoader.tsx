import { useId } from "react";
import { cn } from "cn";

type BrandLoaderProps = {
  /** Visible status line under the mark, e.g. "Finding fares…". Also the accessible name. */
  label: string;
  className?: string;
};

/**
 * Brand loader (FR-GLB-05, Brand board): two strokes trace the W's ribbons in about 1.15 s.
 * It fades in only after 300 ms, so fast routes never flash it; under reduced motion the W is static.
 * Pure CSS: it renders and animates before any JavaScript runs.
 */
function BrandLoader({ label, className }: BrandLoaderProps) {
  const gradientId = `brand-loader-${useId()}`;
  const stroke =
    "fill-none [stroke-width:9] [stroke-linecap:round] [stroke-linejoin:round] [stroke-dasharray:180] [stroke-dashoffset:180] animate-w-draw motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("grid animate-appear-late place-items-center gap-3.5", className)}
    >
      <svg
        viewBox="0 0 120 76"
        aria-hidden="true"
        focusable="false"
        className="h-[76px] w-[120px] overflow-visible"
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="120"
            y2="40"
          >
            <stop offset="0" stopColor="#020D39" />
            <stop offset="0.4" stopColor="#003FBE" />
            <stop offset="0.74" stopColor="#0D8CEE" />
            <stop offset="1" stopColor="#39CCE9" />
          </linearGradient>
        </defs>
        <path
          className={stroke}
          stroke={`url(#${gradientId})`}
          d="M19 6 L37 60 Q41 70 47 62 L64 24 Q65 22 68 22 L102 22"
        />
        <path
          className={cn(stroke, "[animation-delay:180ms]")}
          stroke={`url(#${gradientId})`}
          d="M41 6 Q51 5 54 12 L72 68 L110 6"
        />
      </svg>
      <span className="text-[13px] text-mist-600">{label}</span>
    </div>
  );
}

export { BrandLoader };
