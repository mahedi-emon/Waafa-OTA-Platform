"use client";

import { useState, useTransition } from "react";
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
import { useRouter } from "@/i18n/navigation";
import { leadAction } from "@/lib/admin/leadActions";
import { PhoneActionBar } from "./inbox/PhoneActionBar";
import { LeadStepDialog } from "./LeadStepDialog";

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
 * lead to In progress; every other button opens the step with what it needs (LeadStepDialog). The status follows;
 * nobody picks it. On phones the reply buttons and the main step also sit in a bottom bar (D0 R6).
 */
function LeadActions({ id, status, phone, email, whatsappHref, emailSubject }: LeadActionsProps) {
  const t = useTranslations("Admin.leadActions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const steps = NEXT[status] ?? [];
  const working = OPEN.has(status);
  // Anyone but spam can be called or messaged; on a closed lead the contact is only noted.
  const contactable = status !== "spam";
  // A new lead's main step is the reply itself; afterwards the first step of the status is.
  const main = working && status === "new" ? null : (steps[0] ?? null);
  const more = main ? steps.slice(1) : steps;

  /** Steps without questions run at once: a contact, or "Customer replied". */
  function run(input: LeadActionInput) {
    startTransition(async () => {
      const result = await leadAction(id, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(t(`done.${input.type}`));
      router.refresh();
    });
  }

  const open = (next: Step) => {
    setError(null);
    if (next === "customerReplied") run({ type: "customerReplied" });
    else setStep(next);
  };

  /** The link opens as usual; the contact is logged on the way (first response, New → In progress). */
  const contact = (channel: "call" | "whatsapp" | "email") => {
    setError(null);
    run({ type: "contact", channel });
  };

  const MainIcon = main ? ICONS[main] : null;
  const whatsappButton = (
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
  );
  const callButton = (
    <Button asChild variant="secondary" size="md">
      <a href={`tel:${phone}`} onClick={() => contact("call")}>
        <Phone aria-hidden="true" className="size-4" />
        {t("contact.call")}
      </a>
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] font-semibold text-mist-600">{t("next")}</p>
      {contactable ? (
        <div className="flex flex-wrap gap-2">
          {whatsappButton}
          {callButton}
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
      {error ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}

      <PhoneActionBar label={t("phoneBar")}>
        {contactable ? (
          <Button
            asChild
            variant="whatsapp"
            size={main ? "icon" : "md"}
            className={main ? "shrink-0" : "min-w-0 flex-1"}
          >
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={main ? t("contact.whatsapp") : undefined}
              onClick={() => contact("whatsapp")}
            >
              <WhatsAppIcon className="size-4" />
              {main ? null : t("contact.whatsappShort")}
            </a>
          </Button>
        ) : null}
        {contactable ? (
          <Button
            asChild
            variant="secondary"
            size={main ? "icon" : "md"}
            className={main ? "shrink-0" : "min-w-0 flex-1"}
          >
            <a
              href={`tel:${phone}`}
              aria-label={main ? t("contact.call") : undefined}
              onClick={() => contact("call")}
            >
              <Phone aria-hidden="true" className="size-4" />
              {main ? null : t("contact.call")}
            </a>
          </Button>
        ) : null}
        {main && MainIcon ? (
          <Button
            type="button"
            size="md"
            disabled={pending}
            onClick={() => open(main)}
            className="min-w-0 flex-1"
          >
            <MainIcon aria-hidden="true" className="size-4" />
            <span className="truncate">{t(`steps.${main}`)}</span>
          </Button>
        ) : null}
      </PhoneActionBar>

      <LeadStepDialog
        leadId={id}
        step={step === "customerReplied" ? null : step}
        onClose={() => setStep(null)}
      />
    </div>
  );
}

export { LeadActions };
