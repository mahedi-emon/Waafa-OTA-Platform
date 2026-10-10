"use client";

import type { Ref } from "react";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PhoneFieldProps = {
  id: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  country: string;
  onCountryChange: (code: string) => void;
  countryLabel: string;
  invalid: boolean;
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
  inputProps: Omit<React.ComponentProps<"input">, "id" | "ref" | "type">;
};

/** Mobile number with a country picker (default +880, FR-FLT-02); the number is normalised to E.164 on submit. */
function PhoneField({
  id,
  countries,
  country,
  onCountryChange,
  countryLabel,
  invalid,
  describedBy,
  inputRef,
  inputProps,
}: PhoneFieldProps) {
  const current = countries.find((c) => c.code === country);
  return (
    <div
      className={cn(
        "flex h-12 items-stretch overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-3",
        invalid
          ? "border-danger-600 focus-within:ring-danger-600/15"
          : "border-mist-300 focus-within:border-electric-600 focus-within:ring-ring/20",
      )}
    >
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger
          aria-label={countryLabel}
          className="h-full! w-auto shrink-0 gap-1 rounded-none border-0 border-r border-mist-200 bg-mist-25 px-3 font-semibold tabular-nums shadow-none focus-visible:ring-0"
        >
          <SelectValue>{current?.dial}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name} <span className="text-mist-600 tabular-nums">{c.dial}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        id={id}
        ref={inputRef}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink-900 outline-none placeholder:text-mist-500"
        {...inputProps}
      />
    </div>
  );
}

export { PhoneField };
