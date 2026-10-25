"use client";

import { useId, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { TakaInput } from "@/components/admin/TakaInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAt, type Path } from "@/lib/admin/schema";
import {
  combinations,
  comboWords,
  newVariant,
  sameCombo,
  strayVariants,
  type Combo,
  type MatrixOption,
  type MatrixVariant,
} from "@/lib/admin/variantMatrix";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type VariantsMatrixFieldProps = { path: Path; value: unknown; optional: boolean };

/**
 * The product's variants as a matrix (D0 R8, ADMIN.md §6): every mix of its option values is a row; tick the ones
 * sold and give each a stock code, price, price before discount and stock. One radio picks the variant shown first.
 * Stock codes and ids are suggested; staff never type an id.
 */
function VariantsMatrixField({ path, value, optional }: VariantsMatrixFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.matrix");
  const uid = useId();
  const parent = path.slice(0, -1);
  const optionsPath = [...parent, "options"];
  const defaultPath = [...parent, "defaultVariantId"];
  const options = (getAt(editor.value, optionsPath) ?? []) as MatrixOption[];
  const variants = (Array.isArray(value) ? value : []) as MatrixVariant[];
  const record = (getAt(editor.value, parent) ?? {}) as Record<string, unknown>;
  const base = String(record.shortTitle || record.title || "");
  const defaultId = getAt(editor.value, defaultPath);
  const combos = combinations(options);
  const stray = strayVariants(options, variants);
  const waiting = options.some(
    (option) => !(option.values ?? []).some((item) => item.value?.trim()),
  );

  const tErrors = useTranslations("Admin.editor.errors");
  /** A variant's problem in plain words ("variants.1.price"), from the form's checks or the API. */
  const words = (index: number, name: string) => {
    if (index < 0) return undefined;
    const problem = editor.errors.get([...path, index, name].join("."));
    return problem ? tErrors(problem.code, problem.values ?? {}) : undefined;
  };
  /** One labelled input of a row, with its problem under it. */
  const cell = (id: string, label: string, error: string | undefined, control: ReactNode) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      {/* A label that wraps (Price before discount) still leaves its box in line with the others. */}
      <label htmlFor={id} className="flex flex-1 items-end text-[13.5px] font-medium text-ink-900">
        {label}
      </label>
      {control}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );

  /** Changes the list from its latest state and keeps the default pointing at a sold variant. */
  const updateVariants = (change: (current: MatrixVariant[]) => MatrixVariant[]) => {
    let after: MatrixVariant[] = [];
    editor.update(path, (current) => {
      after = change((Array.isArray(current) ? current : []) as MatrixVariant[]);
      return after;
    });
    const current = getAt(editor.value, defaultPath);
    if (!after.some((variant) => variant.id === current)) {
      editor.change(defaultPath, after[0]?.id ?? "");
    }
  };

  const sell = (combo: Combo, on: boolean) => {
    if (on) {
      const priced = variants.find((variant) => variant.id === defaultId) ?? variants[0];
      const next = newVariant(combo, variants, base, priced?.price);
      updateVariants((current) => [...current, next]);
      if (variants.length === 0) editor.change(defaultPath, next.id);
      return;
    }
    updateVariants((current) => current.filter((variant) => !sameCombo(variant.options, combo)));
  };

  const set = (combo: Combo, name: keyof MatrixVariant, next: unknown) =>
    updateVariants((current) => {
      const index = current.findIndex((variant) => sameCombo(variant.options, combo));
      if (index === -1) {
        // The one row of a product without options is sold from its first value.
        const created = { ...newVariant(combo, current, base), [name]: next };
        return [...current, created];
      }
      return current.map((variant, at) => {
        if (at !== index) return variant;
        const copy: MatrixVariant = { ...variant, [name]: next };
        if (next === undefined) delete copy[name];
        return copy;
      });
    });

  const single = options.length === 0;

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      help={single ? t("single") : t("help")}
      optional={optional}
      group
      {...(meta.error ? { error: meta.error } : {})}
    >
      {waiting && !single ? (
        <p className="rounded-xl bg-warning-50 px-3 py-2 text-[13.5px] text-warning-800">
          {t("waiting")}
        </p>
      ) : null}
      <span id={`${uid}-default`} className="sr-only">
        {t("defaultGroup")}
      </span>
      <RadioGroup
        aria-labelledby={`${uid}-default`}
        value={typeof defaultId === "string" ? defaultId : ""}
        onValueChange={(next) => editor.change(defaultPath, next)}
        className="flex flex-col gap-2"
      >
        {(waiting && !single ? [] : combos).map((combo) => {
          const index = variants.findIndex((variant) => sameCombo(variant.options, combo));
          const variant = index === -1 ? null : variants[index];
          const name = single ? t("standard") : comboWords(options, combo);
          const key = single ? "standard" : JSON.stringify(combo);
          const sold = Boolean(variant) || single;
          return (
            <div
              key={key}
              role="group"
              aria-label={name}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-3",
                variant ? "border-mist-200 bg-white" : "border-dashed border-mist-300 bg-mist-25",
              )}
            >
              <div className="flex min-h-11 flex-wrap items-center gap-3">
                {single ? null : (
                  <Checkbox
                    checked={Boolean(variant)}
                    aria-label={t("sellFor", { name })}
                    onCheckedChange={(on) => sell(combo, on === true)}
                  />
                )}
                <span className="min-w-0 flex-1 font-semibold text-navy-900">{name}</span>
                {variant?.id ? (
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13.5px] text-mist-700">
                    <RadioGroupItem value={variant.id} aria-label={t("defaultFor", { name })} />
                    <span aria-hidden="true">{t("default")}</span>
                  </label>
                ) : null}
              </div>
              {sold ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {cell(
                    `${uid}-${key}-sku`,
                    t("sku"),
                    words(index, "sku"),
                    <Input
                      id={`${uid}-${key}-sku`}
                      value={variant?.sku ?? ""}
                      maxLength={40}
                      autoComplete="off"
                      onChange={(event) => set(combo, "sku", event.target.value.toUpperCase())}
                      onBlur={() => editor.touch([...path, Math.max(index, 0), "sku"])}
                      className="h-11 font-mono"
                    />,
                  )}
                  {cell(
                    `${uid}-${key}-price`,
                    t("price"),
                    words(index, "price"),
                    <TakaInput
                      id={`${uid}-${key}-price`}
                      value={variant?.price}
                      onChange={(next) => set(combo, "price", next)}
                      className="h-11 w-full"
                    />,
                  )}
                  {cell(
                    `${uid}-${key}-mrp`,
                    t("mrp"),
                    words(index, "mrp"),
                    <TakaInput
                      id={`${uid}-${key}-mrp`}
                      value={variant?.mrp}
                      onChange={(next) => set(combo, "mrp", next)}
                      className="h-11 w-full"
                    />,
                  )}
                  {cell(
                    `${uid}-${key}-stock`,
                    t("stock"),
                    words(index, "stock"),
                    <Input
                      id={`${uid}-${key}-stock`}
                      inputMode="numeric"
                      value={variant?.stock === undefined ? "" : String(variant.stock)}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 6);
                        set(combo, "stock", digits ? Number(digits) : 0);
                      }}
                      className="h-11 tabular-nums"
                    />,
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </RadioGroup>
      {stray.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-warning-700/25 bg-warning-50 p-3">
          <p className="text-[13.5px] text-warning-800">{t("stray", { count: stray.length })}</p>
          {stray.map((variant) => (
            <div
              key={variant.id ?? variant.sku}
              className="flex items-center justify-between gap-3"
            >
              <span className="font-mono text-[13.5px] text-ink-900">
                {[variant.sku, ...Object.values(variant.options ?? {})].filter(Boolean).join(" · ")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateVariants((current) =>
                    current.filter((item) => item !== variant && item.id !== variant.id),
                  )
                }
              >
                <Trash2 aria-hidden="true" className="size-4" />
                {t("remove")}
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </FieldShell>
  );
}

export { VariantsMatrixField };
