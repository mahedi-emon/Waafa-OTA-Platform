"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fill, type IntegrationStrings } from "./integrationStrings";

type SecretInputProps = {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
  strings: Pick<IntegrationStrings, "show" | "hide">;
};

/**
 * A write-only secret field (issues 107 and 284): what is typed can be shown or hidden while typing; a saved value
 * never comes back to the browser (the form shows its last four characters), so leaving it empty keeps it.
 */
function SecretInput({
  id,
  label,
  value,
  disabled,
  invalid,
  describedBy,
  onChange,
  strings,
}: SecretInputProps) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = fill(visible ? strings.hide : strings.show, { field: label });

  return (
    <div className="flex min-w-0 gap-2">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        spellCheck={false}
        disabled={disabled}
        value={value}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 font-mono"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={toggleLabel}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}

export { SecretInput };
