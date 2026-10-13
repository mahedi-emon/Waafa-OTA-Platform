"use client";

import { useId, useState } from "react";
import type { VisaChecklistItem } from "@waafa/shared";
import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";

type VisaChecklistProps = {
  items: VisaChecklistItem[];
  labels: { title: string; hint: string; ready: string; allReady: string };
};

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Documents checklist (VisaCountry, MOTION.md "visa checklist ticks with a progress ring"): visitors tick what they
 * already have and the ring fills. `labels.ready` holds `{done}` and `{total}`. Nothing is stored.
 */
function VisaChecklist({ items, labels }: VisaChecklistProps) {
  const id = useId();
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set());
  const progress = items.length ? done.size / items.length : 0;
  const status = labels.ready
    .replace("{done}", String(done.size))
    .replace("{total}", String(items.length));

  function toggle(index: number, on: boolean) {
    setDone((current) => {
      const next = new Set(current);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id={`${id}-title`} className="font-display text-[19px] font-bold text-navy-900">
            {labels.title}
          </h2>
          <p className="text-[14px] text-mist-600">{labels.hint}</p>
        </div>
        <div className="relative grid size-14 shrink-0 place-items-center">
          <svg viewBox="0 0 52 52" aria-hidden="true" className="absolute inset-0 -rotate-90">
            <circle
              cx="26"
              cy="26"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              className="stroke-mist-200"
            />
            <circle
              cx="26"
              cy="26"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className={cn(
                "transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none",
                progress === 1 ? "stroke-success-600" : "stroke-electric-600",
              )}
            />
          </svg>
          <span className="font-display text-[13px] font-extrabold text-navy-900 tabular-nums">
            {done.size}/{items.length}
          </span>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
      <ol className="flex flex-col gap-2">
        {items.map((item, index) => {
          const checked = done.has(index);
          return (
            <li key={item.title}>
              <label
                className={cn(
                  "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                  checked
                    ? "border-success-600/40 bg-success-50"
                    : "border-mist-200 bg-white hover:border-mist-300",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggle(index, value === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-navy-900">
                    <span className="mr-1.5 text-mist-500 tabular-nums">{index + 1}</span>
                    {item.title}
                  </span>
                  <span className="block text-[14px] leading-relaxed text-mist-700">
                    {item.detail}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>
      {progress === 1 ? (
        <p className="text-[14px] font-semibold text-success-600">{labels.allReady}</p>
      ) : null}
    </section>
  );
}

export { VisaChecklist };
