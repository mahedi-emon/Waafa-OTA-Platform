"use client";

import { useId, useState, useTransition } from "react";
import {
  BadgeCheck,
  CircleX,
  FileText,
  Hourglass,
  Mail,
  MessageCircleReply,
  Phone,
  RotateCcw,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { LeadActionInput, LeadStatus } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
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

type Step =
  | "quote"
  | "askDocuments"
  | "askPayment"
  | "customerReplied"
  | "convert"
  | "close"
  | "markSpam"
  | "reopen";

/** What each status offers after the contact buttons (ADMIN.md §8.2), the main step first. */
const NEXT: Record<LeadStatus, Step[]> = {
  new: ["quote", "askDocuments", "markSpam"],
  "in-progress": ["quote", "convert", "askDocuments", "askPayment", "close", "markSpam"],
  quoted: ["convert", "askPayment", "askDocuments", "quote", "close"],
  pending: ["customerReplied", "convert", "close"],
  booked: ["reopen"],
  lost: ["reopen"],
  cancelled: ["reopen"],
  spam: ["reopen"],
};

const ICONS = {
  quote: FileText,
  askDocuments: Hourglass,
  askPayment: WalletCards,
  customerReplied: MessageCircleReply,
  convert: BadgeCheck,
  close: CircleX,
  markSpam: ShieldAlert,
  reopen: RotateCcw,
} satisfies Record<Step, unknown>;

/** Leads the desk is still working: replying moves them along. */
const OPEN = new Set<LeadStatus>(["new", "in-progress", "quoted", "pending"]);

type LeadActionsProps = {
  id: string;
  status: LeadStatus;
  phone: string;
  email?: string | null;
  /** wa.me link with the greeting already written. */
  whatsappHref: string;
  emailSubject: string;
};

/**
 * The next steps for one lead (D0 R4): replying on WhatsApp, by phone or by email logs the contact and moves a new
 * lead to In progress; every other button is an action with what it needs (an amount to convert, a reason to close
 * or reopen). The status follows; nobody picks it.
 */
function LeadActions({ id, status, phone, email, whatsappHref, emailSubject }: LeadActionsProps) {
  const t = useTranslations("Admin.leadActions");
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step | null>(null);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<"lost" | "cancelled">("lost");
  const [error, setError] = useState<string | null>(null);
  const steps = NEXT[status] ?? [];
  const working = OPEN.has(status);
  // Anyone but spam can be called or messaged; on a closed lead the contact is only noted.
  const contactable = status !== "spam";
  // A new lead's main step is the reply itself; afterwards the first step of the status is.
  const main = working && status === "new" ? null : (steps[0] ?? null);
  const more = main ? steps.slice(1) : steps;

  function run(input: LeadActionInput | null, quiet = false) {
    if (!input) return;
    startTransition(async () => {
      const result = await leadAction(id, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setError(message);
        toast.error(message);
        return;
      }
      if (!quiet) toast.success(t(`done.${input.type}`));
      setStep(null);
      router.refresh();
    });
  }

  function inputFor(current: Step): LeadActionInput | null {
    const text = note.trim();
    switch (current) {
      case "quote":
        return { type: "quote", ...(amount ? { amount } : {}), ...(text ? { note: text } : {}) };
      case "askDocuments":
      case "askPayment":
        return { type: current, ...(text ? { note: text } : {}) };
      case "customerReplied":
        return { type: "customerReplied" };
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

  const open = (next: Step) => {
    setAmount(undefined);
    setNote("");
    setOutcome("lost");
    setError(null);
    if (next === "customerReplied") run({ type: "customerReplied" });
    else setStep(next);
  };

  /** The link opens as usual; the contact is logged on the way (first response, New → In progress). */
  const contact = (channel: "call" | "whatsapp" | "email") => {
    setError(null);
    run({ type: "contact", channel }, false);
  };

  const MainIcon = main ? ICONS[main] : null;
  const reasonStep = step === "close" || step === "reopen";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold tracking-wide text-mist-500 uppercase">{t("next")}</p>
      {contactable ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="whatsapp" size="md">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => contact("whatsapp")}
            >
              <WhatsAppIcon className="size-4" />
              {t("contact.whatsapp")}
            </a>
          </Button>
          <Button asChild variant="secondary" size="md">
            <a href={`tel:${phone}`} onClick={() => contact("call")}>
              <Phone aria-hidden="true" className="size-4" />
              {t("contact.call")}
            </a>
          </Button>
          {email ? (
            <Button asChild variant="secondary" size="md">
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(emailSubject)}`}
                onClick={() => contact("email")}
              >
                <Mail aria-hidden="true" className="size-4" />
                {t("contact.email")}
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
      {working && status === "new" ? (
        <p className="text-[13.5px] text-mist-600">{t("replyFirst")}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {main && MainIcon ? (
          <Button type="button" size="md" disabled={pending} onClick={() => open(main)}>
            <MainIcon aria-hidden="true" className="size-4" />
            {t(`steps.${main}`)}
          </Button>
        ) : null}
        {more.map((name) => {
          const Icon = ICONS[name];
          return (
            <Button
              key={name}
              type="button"
              size="md"
              variant={name === "markSpam" || name === "close" ? "ghost" : "secondary"}
              disabled={pending}
              onClick={() => open(name)}
              className={name === "markSpam" ? "text-danger-700" : undefined}
            >
              <Icon aria-hidden="true" className="size-4" />
              {t(`steps.${name}`)}
            </Button>
          );
        })}
      </div>
      {error && step === null ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}

      <Dialog open={step !== null} onOpenChange={(next) => (next ? null : setStep(null))}>
        {step ? (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t(`titles.${step}`)}</DialogTitle>
              <DialogDescription>{t(`bodies.${step}`)}</DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                run(inputFor(step));
              }}
            >
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
                  <RadioGroup
                    aria-labelledby={`${uid}-outcome`}
                    value={outcome}
                    onValueChange={(value) =>
                      setOutcome(value === "cancelled" ? "cancelled" : "lost")
                    }
                  >
                    {(["lost", "cancelled"] as const).map((value) => (
                      <label
                        key={value}
                        htmlFor={`${uid}-${value}`}
                        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-mist-200 p-3 has-data-checked:border-electric-600 has-data-checked:bg-electric-50"
                      >
                        <RadioGroupItem id={`${uid}-${value}`} value={value} className="mt-0.5" />
                        <span className="flex flex-col">
                          <span className="text-[14.5px] font-semibold text-navy-900">
                            {t(`outcomes.${value}`)}
                          </span>
                          <span className="text-[13px] text-mist-600">
                            {t(`outcomeHelp.${value}`)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
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
                <Button type="button" variant="ghost" onClick={() => setStep(null)}>
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
    </div>
  );
}

export { LeadActions };
