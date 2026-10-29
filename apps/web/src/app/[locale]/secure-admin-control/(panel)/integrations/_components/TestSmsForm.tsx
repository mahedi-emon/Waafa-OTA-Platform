"use client";

import { useId, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Send } from "lucide-react";
import type { ProviderEnvironment } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendTestSms } from "@/lib/admin/providerActions";
import type { IntegrationStrings } from "./integrationStrings";

type TestSmsFormProps = {
  provider: string;
  environment: ProviderEnvironment;
  strings: IntegrationStrings["testSms"];
};

/**
 * A test SMS from an SMS card's saved values (issue 252), so the owner checks the Sender ID on their own phone before
 * turning the card on. The answer is the gateway's reason in one plain sentence.
 */
function TestSmsForm({ provider, environment, strings }: TestSmsFormProps) {
  const id = useId();
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const answer = await sendTestSms(provider, environment, phone);
      setResult(
        answer.ok
          ? answer.data
          : {
              ok: false,
              message:
                answer.problem.fields?.[0]?.message ?? answer.problem.detail ?? strings.failed,
            },
      );
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-mist-200 bg-mist-50 p-3">
      <Label htmlFor={`${id}-phone`}>{strings.label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="w-full max-w-[16rem]"
          placeholder="01712-345678"
          value={phone}
          aria-describedby={`${id}-hint`}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={!phone.trim()}
          onClick={send}
        >
          <Send aria-hidden="true" className="size-4" />
          {strings.send}
        </Button>
      </div>
      <p id={`${id}-hint`} className="text-[13px] text-mist-600">
        {strings.hint}
      </p>
      <p role="status" className="flex items-start gap-2 text-[13.5px] text-ink-900">
        {result ? (
          <>
            {result.ok ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-600" />
            ) : (
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-600" />
            )}
            <span className="min-w-0">{result.message}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

export { TestSmsForm };
