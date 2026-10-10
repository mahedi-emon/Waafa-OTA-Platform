"use client";

import { cn } from "cn";

type RangeBoxProps = {
  label: string;
  value: string;
  active: boolean;
  empty: boolean;
  onClick: () => void;
};

/** Start or end box above the calendar; tapping it chooses which date the next tap sets. */
function RangeBox({ label, value, active, empty, onClick }: RangeBoxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border px-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        active ? "border-electric-600 bg-electric-50" : "border-mist-200 hover:border-mist-300",
      )}
    >
      <span className="text-[12.5px] text-mist-600">{label}</span>
      <span
        className={cn(
          "text-[15px] font-semibold tabular-nums",
          empty ? "text-mist-500" : "text-ink-900",
        )}
      >
        {value}
      </span>
    </button>
  );
}

export { RangeBox };
