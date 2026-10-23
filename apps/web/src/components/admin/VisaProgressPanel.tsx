"use client";

import { startTransition, useId, useOptimistic, useState, useTransition } from "react";
import { BadgeCheck, CircleX, Send, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { VisaProgressInput } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { formatPlainDate } from "@/lib/admin/format";
import { visaProgress } from "@/lib/admin/leadActions";
import type { VisaApplicationProgress } from "@/lib/admin/types";
import { ProgressRing } from "./ProgressRing";

type VisaProgressPanelProps = {
  id: string;
  visa: VisaApplicationProgress;
  /** A closed lead's application changes no more until the lead is reopened. */
  closed: boolean;
};

/** Today's date in Asia/Dhaka, for the date fields' first value. */
const todayInDhaka = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);

/**
 * A visa application on its lead (D0 R4, ADMIN.md §8.3): tick documents as they arrive and the stage follows (3 of
 * 8 → Ready to submit), then the submission, the embassy's outcome and the passport going back.
 */
function VisaProgressPanel({ id, visa, closed }: VisaProgressPanelProps) {
  const t = useTranslations("Admin.visaProgress");
  const router = useRouter();
  const uid = useId();
  const [pending, startSaving] = useTransition();
  const [items, tick] = useOptimistic(
    visa.checklist,
    (current, change: { item: string; received: boolean }) =>
      current.map((entry) => (entry.item === change.item ? { ...entry, ...change } : entry)),
  );
  const [on, setOn] = useState(todayInDhaka);
  const [reference, setReference] = useState("");
  const [returnedOn, setReturnedOn] = useState(todayInDhaka);
  const [error, setError] = useState<string | null>(null);
  const locked = closed || visa.stage === "cancelled" || Boolean(visa.submittedOn);
  const received = items.filter((entry) => entry.received).length;

  const run = (input: VisaProgressInput) =>
    startSaving(async () => {
      if (input.type === "document") tick(input);
      const result = await visaProgress(id, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setError(message);
        toast.error(message);
        return;
      }
      setError(null);
      if (input.type !== "document") toast.success(t("saved"));
      startTransition(() => router.refresh());
    });

  const reason =
    visa.stage === "documentsPending"
      ? t("stageReasons.documentsPending", { received, required: visa.required })
      : visa.stage === "submitted"
        ? t("stageReasons.submitted", { date: formatPlainDate(visa.submittedOn) })
        : visa.stage === "passportReturned"
          ? t("stageReasons.passportReturned", { date: formatPlainDate(visa.passportReturnedOn) })
          : t(`stageReasons.${visa.stage}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProgressRing
          value={received}
          total={visa.required}
          label={t("progress", { received, required: visa.required })}
        />
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">{t(`stages.${visa.stage}`)}</p>
          <p className="text-[13.5px] text-mist-600">{reason}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl bg-warning-50 p-3 text-[14px] text-warning-800">
          {t("noChecklist")}
        </p>
      ) : (
        <fieldset className="flex flex-col gap-1" disabled={locked}>
          <legend className="mb-1 text-[13px] font-semibold tracking-wide text-mist-500 uppercase">
            {t("checklist")}
          </legend>
          {items.map((entry, index) => (
            <label
              key={entry.item}
              htmlFor={`${uid}-doc-${index}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-[14.5px] text-ink-900 has-disabled:cursor-default"
            >
              <Checkbox
                id={`${uid}-doc-${index}`}
                checked={entry.received}
                disabled={locked}
                onCheckedChange={(checked) =>
                  run({ type: "document", item: entry.item, received: checked === true })
                }
              />
              <span className={entry.received ? "text-mist-600 line-through" : undefined}>
                {entry.item}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {!closed && visa.stage === "readyToSubmit" ? (
        <form
          className="flex flex-col gap-3 rounded-xl border border-mist-200 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!on || reference.trim().length < 2) {
              setError(t("needed"));
              return;
            }
            run({ type: "submit", on, submissionReference: reference.trim() });
          }}
        >
          <p className="font-semibold text-navy-900">{t("submit")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-on`}>{t("submittedOn")}</Label>
              <Input
                id={`${uid}-on`}
                type="date"
                value={on}
                max={todayInDhaka()}
                onChange={(event) => setOn(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-reference`}>{t("submissionReference")}</Label>
              <Input
                id={`${uid}-reference`}
                value={reference}
                maxLength={60}
                autoComplete="off"
                onChange={(event) => setReference(event.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <div>
            <Button type="submit" size="md" loading={pending}>
              <Send aria-hidden="true" className="size-4" />
              {t("submitConfirm")}
            </Button>
          </div>
        </form>
      ) : null}

      {!closed && visa.stage === "submitted" ? (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-navy-900">{t("outcome")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="md"
              disabled={pending}
              onClick={() => run({ type: "outcome", outcome: "approved" })}
            >
              <BadgeCheck aria-hidden="true" className="size-4" />
              {t("approved")}
            </Button>
            <Button
              type="button"
              size="md"
              variant="secondary"
              disabled={pending}
              onClick={() => run({ type: "outcome", outcome: "rejected" })}
            >
              <CircleX aria-hidden="true" className="size-4" />
              {t("rejected")}
            </Button>
          </div>
        </div>
      ) : null}

      {!closed && (visa.stage === "approved" || visa.stage === "rejected") ? (
        <form
          className="flex flex-col gap-3 rounded-xl border border-mist-200 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!returnedOn) {
              setError(t("needed"));
              return;
            }
            run({ type: "passportReturned", on: returnedOn });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-returned`}>{t("passportReturnedOn")}</Label>
            <Input
              id={`${uid}-returned`}
              type="date"
              value={returnedOn}
              max={todayInDhaka()}
              onChange={(event) => setReturnedOn(event.target.value)}
              className="max-w-56"
            />
          </div>
          <div>
            <Button type="submit" size="md" variant="secondary" loading={pending}>
              <Undo2 aria-hidden="true" className="size-4" />
              {t("passportConfirm")}
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { VisaProgressPanel };
