"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { LeadActionInput } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { leadAction } from "@/lib/admin/leadActions";
import { TakaInput } from "./TakaInput";

/**
 * The steps that ask for something first. `contact` asks how the customer was reached and `ask` whether the lead
 * waits for documents or payment (the board's moves, D0 R6); the rest are the lead page's buttons.
 */
export type LeadDialogStep =
  | "contact"
  | "quote"
  | "ask"
  | "askDocuments"
  | "askPayment"
  | "convert"
  | "close"
  | "markSpam"
  | "reopen";

type LeadStepDialogProps = {
  leadId: string;
  step: LeadDialogStep | null;
  /** Names the lead in the title when the dialog opens away from its page (the board). */
  subject?: string;
  onClose: () => void;
  /** After the step ran; the page refreshes itself. */
  onDone?: () => void;
};

const CHANNELS = ["call", "whatsapp", "email", "note"] as const;
const WAITS = ["askDocuments", "askPayment"] as const;

type Choice = { value: string; label: string; help?: string };

/**
 * One lead step with what it needs (D0 R4, R6): an amount to convert, an outcome and reason to close, a reason to
 * reopen, how the customer was reached, what the lead waits for. The lead page and the board open the same dialog,
 * so a step asks for the same things wherever it starts.
 */
function LeadStepDialog({ leadId, step, subject, onClose, onDone }: LeadStepDialogProps) {
  const t = useTranslations("Admin.leadActions");
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<"lost" | "cancelled">("lost");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("call");
  const [wait, setWait] = useState<(typeof WAITS)[number]>("askDocuments");
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<LeadDialogStep | null>(step);
  // A new step starts with empty answers.
  if (step !== shown) {
    setShown(step);
    setAmount(undefined);
    setNote("");
    setOutcome("lost");
    setChannel("call");
    setWait("askDocuments");
    setError(null);
  }
  const reasonStep = step === "close" || step === "reopen";

  function inputFor(current: LeadDialogStep): LeadActionInput | null {
    const text = note.trim();
    switch (current) {
      case "contact":
        return { type: "contact", channel, ...(text ? { note: text } : {}) };
      case "quote":
        return { type: "quote", ...(amount ? { amount } : {}), ...(text ? { note: text } : {}) };
      case "ask":
        return { type: wait, ...(text ? { note: text } : {}) };
      case "askDocuments":
      case "askPayment":
        return { type: current, ...(text ? { note: text } : {}) };
      case "convert":
        if (!amount) {
          setError(t("amountNeeded"));
          return null;
        }
        return { type: "convert", amount };
      case "close":
        if (text.length < 3) {
          setError(t("reasonNeeded"));
          return null;
        }
        return { type: "close", outcome, reason: text };
      case "reopen":
        if (text.length < 3) {
          setError(t("reasonNeeded"));
          return null;
        }
        return { type: "reopen", reason: text };
      case "markSpam":
        return { type: "markSpam" };
    }
  }

  function submit(current: LeadDialogStep) {
    const input = inputFor(current);
    if (!input) return;
    startTransition(async () => {
      const result = await leadAction(leadId, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(t(`done.${input.type}`));
      onClose();
      onDone?.();
      router.refresh();
    });
  }

  const radios = (
    labelledBy: string,
    value: string,
    onValueChange: (value: string) => void,
    choices: Choice[],
  ) => (
    <RadioGroup aria-labelledby={labelledBy} value={value} onValueChange={onValueChange}>
      {choices.map((choice) => (
        <label
          key={choice.value}
          htmlFor={`${uid}-${choice.value}`}
          className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-mist-200 p-3 has-data-checked:border-electric-600 has-data-checked:bg-electric-50"
        >
          <RadioGroupItem id={`${uid}-${choice.value}`} value={choice.value} className="mt-0.5" />
          <span className="flex flex-col">
            <span className="text-[14.5px] font-semibold text-navy-900">{choice.label}</span>
            {choice.help ? <span className="text-[13px] text-mist-600">{choice.help}</span> : null}
          </span>
        </label>
      ))}
    </RadioGroup>
  );

  return (
    <Dialog open={step !== null} onOpenChange={(next) => (next ? null : onClose())}>
      {step ? (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {subject
                ? t("titleFor", { step: t(`titles.${step}`), subject })
                : t(`titles.${step}`)}
            </DialogTitle>
            <DialogDescription>{t(`bodies.${step}`)}</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit(step);
            }}
          >
            {step === "contact" ? (
              <div className="flex flex-col gap-2">
                <p id={`${uid}-channel`} className="text-[14px] font-medium text-ink-900">
                  {t("channel")}
                </p>
                {radios(
                  `${uid}-channel`,
                  channel,
                  (value) => setChannel(CHANNELS.find((item) => item === value) ?? "call"),
                  CHANNELS.map((value) => ({ value, label: t(`channels.${value}`) })),
                )}
              </div>
            ) : null}
            {step === "ask" ? (
              <div className="flex flex-col gap-2">
                <p id={`${uid}-wait`} className="text-[14px] font-medium text-ink-900">
                  {t("waitFor")}
                </p>
                {radios(
                  `${uid}-wait`,
                  wait,
                  (value) => setWait(WAITS.find((item) => item === value) ?? "askDocuments"),
                  WAITS.map((value) => ({
                    value,
                    label: t(`waits.${value}`),
                    help: t(`bodies.${value}`),
                  })),
                )}
              </div>
            ) : null}
            {step === "quote" || step === "convert" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-amount`}>
                  {t(step === "convert" ? "bookedAmount" : "quotedAmount")}
                </Label>
                <TakaInput
                  id={`${uid}-amount`}
                  value={amount}
                  onChange={setAmount}
                  describedBy={`${uid}-amount-help`}
                  invalid={Boolean(error) && step === "convert"}
                />
                <p id={`${uid}-amount-help`} className="text-[13px] text-mist-600">
                  {t("vat")}
                </p>
              </div>
            ) : null}
            {step === "close" ? (
              <div className="flex flex-col gap-2">
                <p id={`${uid}-outcome`} className="text-[14px] font-medium text-ink-900">
                  {t("outcome")}
                </p>
                {radios(
                  `${uid}-outcome`,
                  outcome,
                  (value) => setOutcome(value === "cancelled" ? "cancelled" : "lost"),
                  (["lost", "cancelled"] as const).map((value) => ({
                    value,
                    label: t(`outcomes.${value}`),
                    help: t(`outcomeHelp.${value}`),
                  })),
                )}
              </div>
            ) : null}
            {step !== "convert" && step !== "markSpam" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-note`}>{t(reasonStep ? "reason" : "note")}</Label>
                <Textarea
                  id={`${uid}-note`}
                  value={note}
                  maxLength={reasonStep ? 300 : 1000}
                  rows={3}
                  onChange={(event) => setNote(event.target.value)}
                  aria-invalid={Boolean(error) && reasonStep ? true : undefined}
                />
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="text-[13.5px] font-medium text-danger-700">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant={step === "markSpam" ? "danger" : "primary"}
                loading={pending}
              >
                {t(`confirm.${step}`)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

export { LeadStepDialog };
