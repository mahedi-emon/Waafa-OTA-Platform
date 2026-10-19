"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JsonSchema, Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type NumberFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
  nullable: boolean;
};

/** A number with − and + buttons that respect the schema's limits (nights, seats, stock). */
function NumberField({ path, node, value, optional, nullable }: NumberFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.number");
  const integer =
    node.type === "integer" || (Array.isArray(node.type) && node.type.includes("integer"));
  const min =
    typeof node.minimum === "number"
      ? node.minimum
      : typeof node.exclusiveMinimum === "number"
        ? node.exclusiveMinimum + 1
        : undefined;
  const max = typeof node.maximum === "number" ? node.maximum : undefined;
  const current = typeof value === "number" ? value : undefined;
  const empty = optional ? undefined : nullable ? null : (min ?? 0);
  const step = (by: number) => {
    const base = current ?? min ?? 0;
    const next = base + by;
    if ((min !== undefined && next < min) || (max !== undefined && next > max)) return;
    meta.change(next);
  };

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <div className="flex max-w-56 items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`${t("less")}: ${meta.label}`}
          disabled={current !== undefined && min !== undefined && current <= min}
          onClick={() => step(-1)}
        >
          <Minus aria-hidden="true" className="size-4" />
        </Button>
        <Input
          id={meta.id}
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : "any"}
          min={min}
          max={max}
          value={current ?? ""}
          aria-describedby={meta.describedBy}
          aria-invalid={meta.error ? true : undefined}
          onBlur={meta.touch}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") return meta.change(empty);
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) meta.change(integer ? Math.round(parsed) : parsed);
          }}
          className="h-11 text-center tabular-nums"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`${t("more")}: ${meta.label}`}
          disabled={current !== undefined && max !== undefined && current >= max}
          onClick={() => step(1)}
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </FieldShell>
  );
}

export { NumberField };
