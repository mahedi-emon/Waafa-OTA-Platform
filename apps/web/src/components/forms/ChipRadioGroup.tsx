"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type ChipRadioGroupProps = {
  labelledBy: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: LucideIcon }>;
  className?: string;
};

/** Single choice shown as chips (PlanTrip budget, hotels, months): a Radix radio group, arrow keys move. */
function ChipRadioGroup({ labelledBy, value, onChange, options, className }: ChipRadioGroupProps) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      value={value}
      onValueChange={onChange}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
            value === option.value
              ? "border-electric-600 bg-electric-50 text-navy-900"
              : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
          )}
        >
          <RadioGroupItem
            value={option.value}
            className="absolute inset-0 size-full opacity-0 after:hidden"
          />
          {option.icon ? (
            <option.icon aria-hidden="true" className="size-4 text-brand-700" />
          ) : null}
          {option.label}
        </label>
      ))}
    </RadioGroup>
  );
}

export { ChipRadioGroup };
