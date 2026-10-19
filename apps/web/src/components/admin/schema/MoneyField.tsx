"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type MoneyFieldProps = {
  path: Path;
  value: unknown;
  optional: boolean;
  nullable: boolean;
};

/** Indian grouping as the site shows prices: 146480 → "1,46,480". */
function group(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

/** Whole taka with the ৳ sign and lakh grouping while typing; stores a plain integer (VAT included). */
function MoneyField({ path, value, optional, nullable }: MoneyFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.money");
  const amount = typeof value === "number" && Number.isFinite(value) ? value : undefined;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const shown = focused ? draft : amount === undefined ? "" : group(amount);

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      help={meta.help ?? t("vat")}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <InputGroup className="h-11 max-w-64">
        <InputGroupAddon className="text-[16px] font-semibold text-mist-600">৳</InputGroupAddon>
        <InputGroupInput
          id={meta.id}
          inputMode="numeric"
          autoComplete="off"
          value={shown}
          aria-describedby={meta.describedBy}
          aria-invalid={meta.error ? true : undefined}
          onFocus={() => {
            setDraft(amount === undefined ? "" : group(amount));
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
            meta.touch();
          }}
          onChange={(event) => {
            const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 12);
            setDraft(digits ? group(Number(digits)) : "");
            meta.change(digits ? Number(digits) : optional ? undefined : nullable ? null : 0);
          }}
          className="text-[16px] font-semibold tabular-nums"
        />
      </InputGroup>
    </FieldShell>
  );
}

export { MoneyField };
