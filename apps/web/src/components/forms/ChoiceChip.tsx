"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "cn";

type ChoiceChipProps = {
  label: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: LucideIcon;
};

/** A toggle chip for multi-select lists (PlanTrip places and interests): aria-pressed, 44 px tall. */
function ChoiceChip({ label, pressed, onPressedChange, icon: Icon }: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        pressed
          ? "border-electric-600 bg-electric-50 text-navy-900"
          : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
      )}
    >
      {pressed ? (
        <Check aria-hidden="true" className="size-4 text-electric-600" />
      ) : Icon ? (
        <Icon aria-hidden="true" className="size-4 text-brand-700" />
      ) : null}
      {label}
    </button>
  );
}

export { ChoiceChip };
