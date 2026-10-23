"use client";

import { useTransition } from "react";
import { FileText, MessageCircleReply, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type { LeadActionInput, LeadStatus } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { leadAction } from "@/lib/admin/leadActions";

/** The one-press step each stage offers on the board; the rest (amounts, reasons) happen on the lead. */
type BoardStep = "reply" | "quote" | "askPayment" | "customerReplied";

const STEP: Partial<Record<LeadStatus, BoardStep>> = {
  new: "reply",
  "in-progress": "quote",
  quoted: "askPayment",
  pending: "customerReplied",
};

const INPUT: Record<Exclude<BoardStep, "reply">, LeadActionInput> = {
  quote: { type: "quote" },
  askPayment: { type: "askPayment" },
  customerReplied: { type: "customerReplied" },
};

const ICONS = { quote: FileText, askPayment: WalletCards, customerReplied: MessageCircleReply };

type BoardCardProps = {
  lead: {
    id: string;
    reference: string;
    name: string;
    summary: string;
    module: string;
    status: LeadStatus;
    assignee: string | null;
    age: string;
    overdue: boolean;
    /** wa.me link with the greeting written. */
    whatsappHref: string;
  };
  strings: {
    steps: Record<BoardStep, string>;
    /** Contains {reference} and {step}. */
    done: string;
    open: string;
    overdue: string;
    unassigned: string;
    failed: string;
  };
};

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");

/**
 * One lead on the board (D0 R4): its stage's next step in one press, the same step the lead page runs (a reply logs
 * the contact and moves a new lead to In progress). Converting or closing needs an amount or a reason, so Open
 * takes it to the lead.
 */
function BoardCard({ lead, strings }: BoardCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const step = STEP[lead.status];

  function run(input: LeadActionInput, words: string, quiet = false) {
    startTransition(async () => {
      const result = await leadAction(lead.id, input);
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      if (!quiet) toast.success(fill(strings.done, { reference: lead.reference, step: words }));
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-mist-200",
        lead.overdue && "ring-warning-700/40",
        pending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/secure-admin-control/leads/${lead.id}`}
          className="min-w-0 font-semibold text-navy-900 hover:underline"
        >
          {lead.reference}
          <span className="block truncate text-[13px] font-normal text-mist-700">{lead.name}</span>
        </Link>
        <Badge variant="neutral">{lead.module}</Badge>
      </div>
      <p className="line-clamp-2 text-[13px] text-ink-900">{lead.summary}</p>
      <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-mist-600">
        <span>{lead.age}</span>
        <span aria-hidden="true">·</span>
        <span>{lead.assignee ?? strings.unassigned}</span>
        {lead.overdue ? <Badge variant="warning">{strings.overdue}</Badge> : null}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {step === "reply" ? (
          <Button asChild variant="whatsapp" size="sm">
            <a
              href={lead.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => run({ type: "contact", channel: "whatsapp" }, strings.steps.reply)}
            >
              <WhatsAppIcon className="size-4" />
              {strings.steps.reply}
            </a>
          </Button>
        ) : step ? (
          (() => {
            const Icon = ICONS[step];
            return (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => run(INPUT[step], strings.steps[step])}
              >
                <Icon aria-hidden="true" className="size-4" />
                {strings.steps[step]}
              </Button>
            );
          })()
        ) : null}
        <Button asChild variant="link" size="sm" className="h-auto px-0 text-[12.5px]">
          <Link href={`/secure-admin-control/leads/${lead.id}`}>{strings.open}</Link>
        </Button>
      </div>
    </li>
  );
}

export { BoardCard };
