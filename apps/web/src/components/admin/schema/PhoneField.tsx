"use client";

import { Input } from "@/components/ui/input";
import { displayPhone } from "@/lib/admin/format";
import type { Path } from "@/lib/admin/schema";
import { toE164 } from "@/lib/admin/phone";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type PhoneFieldProps = { path: Path; value: unknown; optional: boolean };

/** A phone number with its country code (call and WhatsApp buttons use it); local numbers are fixed on blur. */
function PhoneField({ path, value, optional }: PhoneFieldProps) {
  const meta = useField(path);
  const phone = typeof value === "string" ? value : "";
  const shown = phone && displayPhone(phone) !== phone ? displayPhone(phone) : undefined;

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <Input
        id={meta.id}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        value={phone}
        placeholder="+8801712345678"
        aria-describedby={meta.describedBy}
        aria-invalid={meta.error ? true : undefined}
        onChange={(event) =>
          meta.change(event.target.value === "" && optional ? undefined : event.target.value)
        }
        onBlur={() => {
          const fixed = toE164(phone);
          if (fixed !== phone) meta.change(fixed);
          meta.touch();
        }}
        className="h-11 max-w-72 tabular-nums"
      />
      {shown ? <p className="text-[13px] text-mist-600 tabular-nums">{shown}</p> : null}
    </FieldShell>
  );
}

export { PhoneField };
