"use client";

import { useRef, useState } from "react";
import { KeyRound, Smartphone } from "lucide-react";
import { CodeField } from "@/components/admin/twoStep/CodeField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignInState } from "@/lib/admin/sessionActions";
import type { SignInStrings } from "./signInStrings";
import { SignInMessage } from "./SignInMessage";
import { TrustDeviceField } from "./TrustDeviceField";

type CodeStepProps = {
  state: SignInState;
  action: (form: FormData) => void;
  pending: boolean;
  strings: SignInStrings;
  /** Back to the password, with a fresh form. */
  onRestart: () => void;
};

/**
 * The second step (issue 234): the 6-digit code from the authenticator app, or a recovery code instead, and
 * "Trust this device for 30 days". The form sends itself when the sixth digit is typed.
 */
function CodeStep({ state, action, pending, strings, onRestart }: CodeStepProps) {
  const [recovery, setRecovery] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const error =
    state.error === "wrong-code"
      ? strings.wrongCode
      : state.error === "missing-code"
        ? strings.missingCode
        : state.error === "unavailable"
          ? strings.unavailable
          : null;

  return (
    <form ref={form} action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="stage" value="code" />
      <div className="flex gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-electric-50 text-brand-700">
          {recovery ? (
            <KeyRound aria-hidden="true" className="size-5" />
          ) : (
            <Smartphone aria-hidden="true" className="size-5" />
          )}
        </span>
        <div>
          <h2 className="font-display text-[19px] leading-snug font-bold text-navy-900">
            {strings.codeTitle}
          </h2>
          <p className="mt-1 text-[14.5px] text-mist-600">
            {recovery ? strings.recoveryHint : strings.codeLead}
          </p>
        </div>
      </div>

      {error ? <SignInMessage id="code-error" tone="danger" title={error} /> : null}

      {recovery ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-recovery">{strings.recoveryLabel}</Label>
          <Input
            id="admin-recovery"
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono tracking-wide uppercase"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "code-error" : undefined}
          />
        </div>
      ) : (
        <CodeField
          key={state.attempt ?? 0}
          id="admin-code"
          autoFocus={(state.attempt ?? 0) > 0}
          label={strings.codeLabel}
          invalid={Boolean(error)}
          describedBy={error ? "code-error" : undefined}
          onComplete={() => form.current?.requestSubmit()}
        />
      )}

      <TrustDeviceField label={strings.trust} hint={strings.trustHint} />

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {strings.verify}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="link"
          className="px-0"
          onClick={() => setRecovery((on) => !on)}
        >
          {recovery ? strings.useApp : strings.useRecovery}
        </Button>
        <Button type="button" variant="link" className="px-0" onClick={onRestart}>
          {strings.startAgain}
        </Button>
      </div>
    </form>
  );
}

export { CodeStep };
