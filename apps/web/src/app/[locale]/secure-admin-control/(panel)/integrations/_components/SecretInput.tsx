"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { ProviderEnvironment } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revealProviderSecret } from "@/lib/admin/providerActions";
import { fill, type IntegrationStrings } from "./integrationStrings";

type SecretInputProps = {
  id: string;
  label: string;
  provider: string;
  environment: ProviderEnvironment;
  fieldKey: string;
  value: string;
  /** A value is saved for this field (the input stays empty and keeps it). */
  saved: boolean;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
  strings: Pick<
    IntegrationStrings,
    "show" | "hide" | "reveal" | "revealHint" | "revealedLabel" | "failed"
  >;
};

const REVEAL_MS = 30_000;

/**
 * A write-only secret field (issue 107): what is typed can be shown or hidden; a saved value stays on the server until the
 * Super Admin asks to reveal it, which the API writes to the audit log. The revealed value hides itself after 30 s.
 */
function SecretInput({
  id,
  label,
  provider,
  environment,
  fieldKey,
  value,
  saved,
  disabled,
  invalid,
  describedBy,
  onChange,
  strings,
}: SecretInputProps) {
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (revealed === null) return;
    const timer = window.setTimeout(() => setRevealed(null), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  function reveal() {
    startTransition(async () => {
      const result = await revealProviderSecret(provider, environment, fieldKey);
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      setRevealed(result.data.value);
    });
  }

  const toggleLabel = fill(visible ? strings.hide : strings.show, { field: label });

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
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
      {saved ? (
        revealed === null ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto w-fit p-0"
            loading={pending}
            onClick={reveal}
          >
            <KeyRound aria-hidden="true" />
            {strings.reveal}
          </Button>
        ) : (
          <div role="status" className="rounded-lg bg-mist-50 px-3 py-2 text-sm">
            <span className="block text-mist-600">
              {fill(strings.revealedLabel, { field: label })}
            </span>
            <code className="block font-mono break-all text-navy-900 select-all">{revealed}</code>
            <span className="mt-1 flex items-center justify-between gap-2 text-mist-500">
              {strings.revealHint}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1"
                onClick={() => setRevealed(null)}
              >
                {fill(strings.hide, { field: "" }).trim()}
              </Button>
            </span>
          </div>
        )
      ) : null}
    </div>
  );
}

export { SecretInput };
