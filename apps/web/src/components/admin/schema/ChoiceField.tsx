"use client";

import { useTranslations } from "next-intl";
import { cn } from "cn";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type ChoiceFieldProps = {
  path: Path;
  value: unknown;
  optional: boolean;
  nullable: boolean;
  /** Options computed from the record itself (a product's variants), when the field's own choices don't apply. */
  options?: Array<{ value: string; label: string }>;
};

/** Up to six options as radio cards; more as a list to pick from. Always labelled by the field (aria-labelledby). */
function ChoiceField({ path, value, optional, nullable, options }: ChoiceFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const choices = options ?? meta.field.choices ?? [];
  const current =
    typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
  const clearable = (optional || nullable) && current !== "";
  const clear = clearable ? (
    <button
      type="button"
      onClick={() => meta.change(optional ? undefined : null)}
      className="relative min-h-8 cursor-pointer rounded-full px-2.5 text-[12.5px] font-semibold text-mist-600 after:absolute after:inset-x-0 after:-inset-y-1.5 hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      {t("clear")}
    </button>
  ) : null;
  const shell = {
    id: meta.id,
    label: meta.label,
    ...(meta.help ? { help: meta.help } : {}),
    optional,
    ...(meta.error ? { error: meta.error } : {}),
    actions: clear,
  };

  if (choices.length > 6) {
    return (
      <FieldShell {...shell}>
        <Select value={current} onValueChange={(next) => meta.change(next)}>
          <SelectTrigger
            id={meta.id}
            aria-describedby={meta.describedBy}
            aria-invalid={meta.error ? true : undefined}
            className="h-11 w-full max-w-md"
            onBlur={meta.touch}
          >
            <SelectValue placeholder={t("choose")} />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>
    );
  }

  return (
    <FieldShell {...shell} group>
      <RadioGroup
        value={current}
        onValueChange={(next) => meta.change(next)}
        aria-labelledby={`${meta.id}-label`}
        aria-describedby={meta.describedBy}
        className={cn(
          "grid gap-2",
          choices.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {choices.map((choice) => {
          const itemId = `${meta.id}-${choice.value}`;
          const selected = current === choice.value;
          return (
            <label
              key={choice.value}
              htmlFor={itemId}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14.5px] transition-colors duration-150",
                selected
                  ? "border-electric-600 bg-electric-50 font-semibold text-navy-900"
                  : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
              )}
            >
              <RadioGroupItem id={itemId} value={choice.value} />
              <span className="min-w-0">{choice.label}</span>
            </label>
          );
        })}
      </RadioGroup>
    </FieldShell>
  );
}

export { ChoiceField };
