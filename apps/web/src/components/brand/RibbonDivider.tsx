import { useId } from "react";
import { cn } from "cn";

/** Section divider (Brand board, "The ribbon at work"): a short flowing stroke that fades at both ends. */
function RibbonDivider({ className }: { className?: string }) {
  const gradientId = `ribbon-divider-${useId()}`;

  return (
    <svg
      viewBox="0 0 300 30"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none block h-[30px] w-[220px]", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#003FBE" stopOpacity="0" />
          <stop offset="0.5" stopColor="#0D8CEE" />
          <stop offset="1" stopColor="#39CCE9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 22 C 80 22 110 6 160 8 S 250 20 300 10"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { RibbonDivider };
