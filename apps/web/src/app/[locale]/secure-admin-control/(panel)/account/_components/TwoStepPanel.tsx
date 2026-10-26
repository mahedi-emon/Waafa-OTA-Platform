"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import type { TwoStepStatus } from "@waafa/shared";
import { CodeField } from "@/components/admin/twoStep/CodeField";
import { QrCode } from "@/components/admin/twoStep/QrCode";
import { RecoveryCodesPanel } from "@/components/admin/twoStep/RecoveryCodesPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import {
  confirmTwoStepSetup,
  makeRecoveryCodes,
  startTwoStepSetup,
  turnOffTwoStep,
  type TwoStepSetup,
} from "@/lib/admin/twoStepActions";

type TwoStepPanelProps = {
  status: TwoStepStatus;
  email: string;
  /** Resolved on the server: the date, the plurals. */
  strings: {
    title: string;
    onLead: string;
    offLead: string;
    required: string;
    on: string;
    off: string;
    recoveryLeft: string;
    trustedDevices: string;
    turnOn: string;
    setupScan: string;
    setupKey: string;
    setupCode: string;
    setupConfirm: string;
    setupDone: string;
    newCodes: string;
    newCodesLead: string;
    makeCodes: string;
    codesMade: string;
    turnOff: string;
    turnOffLead: string;
    turnedOff: string;
    wrongCode: string;
    expiredSetup: string;
    password: string;
    wrongPassword: string;
    cancel: string;
    failed: string;
    qrLabel: string;
    savedTitle: string;
    savedLead: string;
    done: string;
    codes: {
      codesLabel: string;
      copy: string;
      copied: string;
      download: string;
      fileName: string;
      fileTitle: string;
      fileNote: string;
    };
  };
};

type Mode = "idle" | "setup" | "codes" | "off" | "saved";

/**
 * My account › Two-step sign-in (issue 234): turn it on with a QR code and a confirming code, make new recovery
 * codes, or turn it off with the password (not for roles that need it). Recovery codes show once, here.
 */
function TwoStepPanel({ status, email, strings }: TwoStepPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<TwoStepSetup | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setMode("idle");
    setSetup(null);
    setCode("");
    setPassword("");
    setError(null);
  };

  const problemText = (problemCode: string | undefined) =>
    problemCode === "wrong-code"
      ? strings.wrongCode
      : problemCode === "expired"
        ? strings.expiredSetup
        : problemCode === "wrong-password"
          ? strings.wrongPassword
          : strings.failed;

  function begin() {
    setError(null);
    startTransition(async () => {
      const result = await startTwoStepSetup();
      if (!result.ok) {
        setError(strings.failed);
        return;
      }
      setSetup(result.data);
      setMode("setup");
    });
  }

  function confirm() {
    if (!setup) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmTwoStepSetup(setup.challenge, code);
      if (!result.ok) {
        setError(problemText(result.problem.code));
        setCode("");
        return;
      }
      setCodes(result.data.recoveryCodes);
      setMode("saved");
      toast.success(strings.setupDone);
    });
  }

  function newCodes() {
    setError(null);
    startTransition(async () => {
      const result = await makeRecoveryCodes(code);
      if (!result.ok) {
        setError(problemText(result.problem.code));
        setCode("");
        return;
      }
      setCodes(result.data.recoveryCodes);
      setMode("saved");
      toast.success(strings.codesMade);
    });
  }

  function off() {
    setError(null);
    startTransition(async () => {
      const result = await turnOffTwoStep(password);
      if (!result.ok) {
        setError(problemText(result.problem.code));
        return;
      }
      toast.success(strings.turnedOff);
      reset();
      router.refresh();
    });
  }

  const errorLine = error ? (
    <p id="two-step-error" role="alert" className="text-[14px] font-medium text-danger-600">
      {error}
    </p>
  ) : null;

  return (
    <section aria-labelledby="two-step-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span
            className={
              status.enabled
                ? "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success-700"
                : "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning-50 text-warning-800"
            }
          >
            {status.enabled ? (
              <ShieldCheck aria-hidden="true" className="size-5" />
            ) : (
              <ShieldOff aria-hidden="true" className="size-5" />
            )}
          </span>
          <div>
            <h2 id="two-step-title" className="font-display text-[18px] font-bold text-navy-900">
              {strings.title}
            </h2>
            <p className="mt-1 max-w-prose text-[14.5px] text-mist-600">
              {status.enabled ? strings.onLead : strings.offLead}
            </p>
            {status.enabled && status.required ? (
              <p className="mt-1 text-[13.5px] text-mist-600">{strings.required}</p>
            ) : null}
          </div>
        </div>
        <Badge variant={status.enabled ? "success" : "warning"}>
          {status.enabled ? strings.on : strings.off}
        </Badge>
      </div>

      {status.enabled && mode === "idle" ? (
        <p className="text-[14px] text-ink-900 tabular-nums">
          {strings.recoveryLeft} · {strings.trustedDevices}
        </p>
      ) : null}

      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          {status.enabled ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setMode("codes")}>
                {strings.newCodes}
              </Button>
              {!status.required ? (
                <Button size="sm" variant="ghost" onClick={() => setMode("off")}>
                  {strings.turnOff}
                </Button>
              ) : null}
            </>
          ) : (
            <Button size="sm" loading={pending} onClick={begin}>
              {strings.turnOn}
            </Button>
          )}
          {errorLine}
        </div>
      ) : null}

      {mode === "setup" && setup ? (
        <div className="flex flex-col gap-4 border-t border-mist-100 pt-4">
          <p className="text-[14.5px] text-ink-900">{strings.setupScan}</p>
          <QrCode rows={setup.qr} label={strings.qrLabel} className="border border-mist-200 p-2" />
          <div className="flex flex-col gap-1">
            <p className="text-[13.5px] text-mist-600">{strings.setupKey}</p>
            <code className="w-fit max-w-full rounded-lg bg-mist-50 px-2.5 py-1.5 font-mono text-[14px] font-semibold tracking-wide break-words text-navy-900 select-all">
              {setup.key}
            </code>
          </div>
          <CodeField
            id="account-setup-code"
            label={strings.setupCode}
            value={code}
            onChange={setCode}
            invalid={Boolean(error)}
            describedBy={error ? "two-step-error" : undefined}
          />
          {errorLine}
          <div className="flex gap-2">
            <Button size="sm" loading={pending} disabled={code.length !== 6} onClick={confirm}>
              {strings.setupConfirm}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "codes" ? (
        <div className="flex flex-col gap-4 border-t border-mist-100 pt-4">
          <p className="text-[14.5px] text-ink-900">{strings.newCodesLead}</p>
          <CodeField
            id="account-codes-code"
            label={strings.setupCode}
            value={code}
            onChange={setCode}
            invalid={Boolean(error)}
            describedBy={error ? "two-step-error" : undefined}
          />
          {errorLine}
          <div className="flex gap-2">
            <Button size="sm" loading={pending} disabled={code.length !== 6} onClick={newCodes}>
              {strings.makeCodes}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "off" ? (
        <form
          className="flex max-w-md flex-col gap-4 border-t border-mist-100 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            off();
          }}
        >
          <p className="text-[14.5px] text-ink-900">{strings.turnOffLead}</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-off-password">{strings.password}</Label>
            <Input
              id="account-off-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "two-step-error" : undefined}
            />
          </div>
          {errorLine}
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="danger" loading={pending} disabled={!password}>
              {strings.turnOff}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              {strings.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      {mode === "saved" ? (
        <div className="flex flex-col gap-4 border-t border-mist-100 pt-4">
          <div>
            <h3 className="font-display text-[16px] font-bold text-navy-900">
              {strings.savedTitle}
            </h3>
            <p className="mt-1 max-w-prose text-[14.5px] text-mist-600">{strings.savedLead}</p>
          </div>
          <RecoveryCodesPanel codes={codes} email={email} strings={strings.codes} />
          <div>
            <Button
              size="sm"
              onClick={() => {
                reset();
                setCodes([]);
                router.refresh();
              }}
            >
              {strings.done}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { TwoStepPanel };
