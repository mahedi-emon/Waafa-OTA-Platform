"use client";

import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

type TakaInputProps = {
  id: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  describedBy?: string | undefined;
  invalid?: boolean;
  className?: string;
};

/** Indian grouping as the site shows prices: 146480 → "1,46,480". */
const group = (amount: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);

/** Whole taka with the ৳ sign and lakh grouping while typing, for amounts outside the form engine (D0 R4). */
function TakaInput({ id, value, onChange, describedBy, invalid, className }: TakaInputProps) {
  const [draft, setDraft] = useState(value === undefined ? "" : group(value));

  return (
    <InputGroup className={className ?? "h-11 max-w-64"}>
      <InputGroupAddon className="text-[16px] font-semibold text-mist-600">৳</InputGroupAddon>
      <InputGroupInput
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        aria-describedby={describedBy}
        aria-invalid={invalid ? true : undefined}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 12);
          setDraft(digits ? group(Number(digits)) : "");
          onChange(digits ? Number(digits) : undefined);
        }}
        className="text-[16px] font-semibold tabular-nums"
      />
    </InputGroup>
  );
}

export { TakaInput };
