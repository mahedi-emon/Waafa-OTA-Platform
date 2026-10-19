"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { childPattern, patternOf } from "@/lib/admin/blueprints/paths";
import { defaultFor, discriminatorOf, type JsonSchema, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { ObjectField } from "./ObjectField";
import { RawJsonField } from "./RawJsonField";
import { SchemaField } from "./SchemaField";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type UnionFieldProps = {
  options: JsonSchema[];
  nullable: boolean;
  path: Path;
  value: unknown;
  optional: boolean;
};

/**
 * One of several shapes (a gallery item is a photo or a video; a collection's products are picked or follow rules):
 * choose the kind with radio cards, then fill its fields. Fields both kinds share keep their values.
 */
function UnionField({ options, nullable, path, value, optional }: UnionFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");

  if (options.length === 1 && options[0]) {
    if (value === null || value === undefined) {
      return (
        <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-dashed border-mist-300 px-4 py-2.5">
          <span className="text-[14px] font-semibold text-navy-900">{meta.label}</span>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => meta.change(defaultFor(options[0] as JsonSchema, editor.root))}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("set")}
          </Button>
        </div>
      );
    }
    return (
      <SchemaField schema={options[0]} path={path} value={value} optional={optional || nullable} />
    );
  }

  const discriminator = discriminatorOf(options);
  if (!discriminator) return <RawJsonField path={path} value={value} optional={optional} />;

  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  const kind = record?.[discriminator];
  const active = options.find((option) => option.properties?.[discriminator]?.const === kind);
  // List items' fields hang off the list's pattern ("items_kind"), a group's off its own.
  const base = typeof path.at(-1) === "number" ? patternOf(path.slice(0, -1)) : meta.pattern;
  const choices = editor.blueprint.fields[childPattern(base, discriminator)]?.choices ?? [];
  const labelOf = (option: JsonSchema) => {
    const value = String(option.properties?.[discriminator]?.const ?? "");
    return choices.find((choice) => choice.value === value)?.label ?? value;
  };
  const switchTo = (next: string) => {
    const option = options.find(
      (candidate) => candidate.properties?.[discriminator]?.const === next,
    );
    if (!option) return;
    const fresh = defaultFor(option, editor.root) as Record<string, unknown>;
    // Keep what both shapes share (an item's id and caption).
    for (const name of Object.keys(option.properties ?? {}))
      if (name !== discriminator && record && record[name] !== undefined)
        fresh[name] = record[name];
    meta.change(fresh);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <FieldShell
        id={meta.id}
        label={editor.blueprint.fields[childPattern(base, discriminator)]?.label ?? meta.label}
        optional={optional}
        {...(meta.error ? { error: meta.error } : {})}
        group
      >
        <RadioGroup
          value={typeof kind === "string" ? kind : ""}
          onValueChange={switchTo}
          aria-labelledby={`${meta.id}-label`}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {options.map((option) => {
            const optionValue = String(option.properties?.[discriminator]?.const ?? "");
            const itemId = `${meta.id}-${optionValue}`;
            const selected = kind === optionValue;
            return (
              <label
                key={optionValue}
                htmlFor={itemId}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14.5px] transition-colors duration-150",
                  selected
                    ? "border-electric-600 bg-electric-50 font-semibold text-navy-900"
                    : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
                )}
              >
                <RadioGroupItem id={itemId} value={optionValue} />
                {labelOf(option)}
              </label>
            );
          })}
        </RadioGroup>
      </FieldShell>
      {active ? (
        <ObjectField schema={active} path={path} value={value} optional={false} bare />
      ) : null}
    </div>
  );
}

export { UnionField };
