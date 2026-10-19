"use client";

import { Switch } from "@/components/ui/switch";
import type { Path } from "@/lib/admin/schema";
import { useField } from "./useField";

type SwitchFieldProps = { path: Path; value: unknown };

/** On or off, with the label saying what turns on ("Show on website") and one line of help under it. */
function SwitchField({ path, value }: SwitchFieldProps) {
  const meta = useField(path);
  return (
    <div className="flex min-h-12 items-start justify-between gap-4 rounded-xl border border-mist-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={meta.id} className="text-[14px] font-semibold text-navy-900">
          {meta.label}
        </label>
        {meta.help ? (
          <p id={`${meta.id}-help`} className="mt-0.5 text-[13.5px] leading-snug text-mist-600">
            {meta.help}
          </p>
        ) : null}
        {meta.error ? (
          <p
            id={`${meta.id}-error`}
            role="alert"
            className="mt-1 text-[13px] font-medium text-danger-700"
          >
            {meta.error}
          </p>
        ) : null}
      </div>
      <Switch
        id={meta.id}
        checked={value === true}
        aria-describedby={meta.describedBy}
        onCheckedChange={(checked) => meta.change(checked)}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}

export { SwitchField };
