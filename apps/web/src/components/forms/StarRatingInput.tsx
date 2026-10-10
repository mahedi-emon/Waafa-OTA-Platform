"use client";

import { Star } from "lucide-react";
import { cn } from "cn";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type StarRatingInputProps = {
  labelledBy: string;
  /** "" for no rating, otherwise "1" to "5". */
  value: string;
  onChange: (value: string) => void;
  /** Accessible name per star, e.g. ["1 star", "2 stars", …]. */
  starLabels: string[];
  clearLabel: string;
};

/**
 * Optional star rating as a Radix radio group (arrow keys move, each star is a 44 px target). Stars up to the choice
 * fill in; "No rating" clears it.
 */
function StarRatingInput({
  labelledBy,
  value,
  onChange,
  starLabels,
  clearLabel,
}: StarRatingInputProps) {
  const chosen = Number(value) || 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RadioGroup
        aria-labelledby={labelledBy}
        value={value}
        onValueChange={onChange}
        className="flex w-auto gap-0.5"
      >
        {starLabels.map((label, index) => {
          const n = index + 1;
          return (
            <label
              key={label}
              className="relative grid size-11 cursor-pointer place-items-center rounded-full has-focus-visible:ring-3 has-focus-visible:ring-ring/40"
            >
              <RadioGroupItem
                value={String(n)}
                aria-label={label}
                className="absolute inset-0 size-full opacity-0 after:hidden"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-7 transition-colors",
                  n <= chosen ? "fill-electric-600 text-electric-600" : "text-mist-300",
                )}
              />
            </label>
          );
        })}
      </RadioGroup>
      {chosen > 0 ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="min-h-11 rounded-full px-3 text-[13.5px] font-semibold text-mist-700 hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}

export { StarRatingInput };
