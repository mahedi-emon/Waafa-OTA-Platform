"use client";

import { Check } from "lucide-react";
import { cn } from "cn";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type ChoicesFieldProps = { path: Path; value: unknown; optional: boolean };

/** Several options at once (categories, tags, badges) as toggle chips, in the schema's order. */
function ChoicesField({ path, value, optional }: ChoicesFieldProps) {
  const meta = useField(path);
  const chosen = new Set(Array.isArray(value) ? value.map(String) : []);
  const choices = meta.field.choices ?? [];
  const toggle = (option: string) => {
    const next = new Set(chosen);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    // Keep the schema's order so saved lists stay stable.
    meta.change(choices.map((choice) => choice.value).filter((item) => next.has(item)));
  };

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <ul className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const on = chosen.has(choice.value);
          return (
            <li key={choice.value}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(choice.value)}
                onBlur={meta.touch}
                className={cn(
                  "relative inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[14px] transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-[3px] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  on
                    ? "border-electric-600 bg-electric-50 font-semibold text-brand-700"
                    : "border-mist-300 bg-white text-ink-900 hover:border-mist-400",
                )}
              >
                {on ? <Check aria-hidden="true" className="size-3.5" /> : null}
                {choice.label}
              </button>
            </li>
          );
        })}
      </ul>
    </FieldShell>
  );
}

export { ChoicesField };
