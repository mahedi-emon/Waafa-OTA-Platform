"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JsonSchema, Path } from "@/lib/admin/schema";
import { timeLabel } from "@/lib/admin/time";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type TimeOfDayFieldProps = { path: Path; node: JsonSchema; value: unknown };

/** A time of day every half hour (office hours), stored as minutes after midnight in Asia/Dhaka. */
function TimeOfDayField({ path, node, value }: TimeOfDayFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.time");
  const min = typeof node.minimum === "number" ? node.minimum : 0;
  const max = typeof node.maximum === "number" ? node.maximum : 1439;
  const options: number[] = [];
  for (let minutes = Math.ceil(min / 30) * 30; minutes <= max; minutes += 30) options.push(minutes);
  const current = typeof value === "number" ? value : undefined;
  if (current !== undefined && !options.includes(current)) options.push(current);
  options.sort((a, b) => a - b);

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <Select
        value={current === undefined ? undefined : String(current)}
        onValueChange={(next) => meta.change(Number(next))}
      >
        <SelectTrigger
          id={meta.id}
          aria-describedby={meta.describedBy}
          className="h-11 w-44 tabular-nums"
          onBlur={meta.touch}
        >
          <SelectValue placeholder={t("pick")} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((minutes) => (
            <SelectItem key={minutes} value={String(minutes)}>
              {minutes === 1440 ? t("midnight") : timeLabel(minutes)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export { TimeOfDayField };
