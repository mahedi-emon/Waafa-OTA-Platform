"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type NumberStepperProps = {
  label: string;
  sub?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  labels: { decrease: string; increase: string };
};

/** A form stepper (travellers, rooms): 44 px buttons that stay focusable at their limits (aria-disabled). */
function NumberStepper({ label, sub, value, min, max, onChange, labels }: NumberStepperProps) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="flex items-center justify-between gap-4 py-2.5"
    >
      <div className="min-w-0">
        <p id={id} className="text-[15px] font-semibold text-ink-900">
          {label}
        </p>
        {sub ? <p className="text-[13px] text-mist-600">{sub}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={labels.decrease}
          aria-disabled={value <= min}
          onClick={() => value > min && onChange(value - 1)}
        >
          <Minus aria-hidden="true" />
        </Button>
        <output
          aria-live="polite"
          className="w-7 text-center font-display text-lg font-extrabold text-navy-900 tabular-nums"
        >
          {value}
        </output>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={labels.increase}
          aria-disabled={value >= max}
          onClick={() => value < max && onChange(value + 1)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export { NumberStepper };
