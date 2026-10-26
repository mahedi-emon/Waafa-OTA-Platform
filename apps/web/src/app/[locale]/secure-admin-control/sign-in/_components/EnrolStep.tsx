"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { CodeField } from "@/components/admin/twoStep/CodeField";
import { QrCode } from "@/components/admin/twoStep/QrCode";
import { Button } from "@/components/ui/button";
import type { SignInState } from "@/lib/admin/sessionActions";
import type { SignInStrings } from "./signInStrings";
import { SignInMessage } from "./SignInMessage";
import { TrustDeviceField } from "./TrustDeviceField";

const STEP =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[13px] font-bold text-white tabular-nums";

type EnrolStepProps = {
  state: SignInState;
  action: (form: FormData) => void;
  pending: boolean;
  strings: SignInStrings;
  onRestart: () => void;
};

/**
 * First sign-in for Super Admin and Admin (issue 234): three numbered steps to add Waafa Admin to an authenticator
 * app (QR code, or the key typed by hand), then the first code turns two-step sign-in on.
 */
function EnrolStep({ state, action, pending, strings, onRestart }: EnrolStepProps) {
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const error =
    state.error === "wrong-code"
      ? strings.wrongCode
      : state.error === "missing-code"
        ? strings.missingCode
        : state.error === "unavailable"
          ? strings.unavailable
          : null;
  const enrol = state.enrol;

  return (
    <form ref={form} action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="stage" value="enrol" />
      <div className="flex gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-electric-50 text-brand-700">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2
            ref={heading}
            tabIndex={-1}
            className="font-display text-[19px] leading-snug font-bold text-navy-900 focus:outline-none"
          >
            {strings.enrolTitle}
          </h2>
          <p className="mt-1 text-[14.5px] text-mist-600">{strings.enrolLead}</p>
        </div>
      </div>

      {error ? <SignInMessage id="enrol-error" tone="danger" title={error} /> : null}

      <ol className="flex flex-col gap-4 text-[14.5px] text-ink-900">
        <li className="flex gap-3">
          <span aria-hidden="true" className={STEP}>
            1
          </span>
          <p className="pt-0.5">{strings.enrolApp}</p>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className={STEP}>
            2
          </span>
          <div className="flex min-w-0 flex-col gap-3 pt-0.5">
            <p>{strings.enrolScan}</p>
            {enrol ? (
              <>
                <QrCode
                  rows={enrol.qr}
                  label={strings.qrLabel}
                  className="border border-mist-200 p-2"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-[13.5px] text-mist-600">{strings.enrolKey}</p>
                  <code className="rounded-lg bg-mist-50 px-2.5 py-1.5 font-mono text-[14px] font-semibold tracking-wide break-words text-navy-900 select-all">
                    {enrol.key}
                  </code>
                </div>
              </>
            ) : null}
          </div>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className={STEP}>
            3
          </span>
          <div className="flex min-w-0 flex-col gap-3 pt-0.5">
            <p>{strings.enrolCode}</p>
            <CodeField
              key={state.attempt ?? 0}
              id="admin-enrol-code"
              autoFocus={(state.attempt ?? 0) > 0}
              label={strings.codeLabel}
              invalid={Boolean(error)}
              describedBy={error ? "enrol-error" : undefined}
              onComplete={() => form.current?.requestSubmit()}
            />
          </div>
        </li>
      </ol>

      <TrustDeviceField label={strings.trust} hint={strings.trustHint} />

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {strings.enrolSubmit}
      </Button>
      <Button type="button" variant="link" className="self-start px-0" onClick={onRestart}>
        {strings.startAgain}
      </Button>
    </form>
  );
}

export { EnrolStep };
