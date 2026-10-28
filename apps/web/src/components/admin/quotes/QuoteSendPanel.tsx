"use client";

import { useId, useState, useTransition } from "react";
import { Copy, FileText, Mail, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { QuoteChannel } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { sendQuote, withdrawQuote } from "@/lib/admin/quoteActions";

type QuoteSendPanelProps = {
  id: string;
  /** Sending is open while the quote is a draft or sent and not past its last day. */
  canSend: boolean;
  canWithdraw: boolean;
  email: string | null;
  whatsapp: string | null;
  link: string;
  pdfHref: string;
  labels: {
    email: string;
    emailTo: string;
    noEmail: string;
    whatsapp: string;
    linkLabel: string;
    linkHint: string;
    copy: string;
    copied: string;
    pdf: string;
    sent: string;
    withdraw: string;
    withdrawConfirm: string;
    withdrawn: string;
    cancel: string;
    failed: string;
  };
};

/**
 * Sends a quote (issue 298): by email from the template, or on WhatsApp with the link written in (the press is
 * recorded as it opens); copy the link; open the PDF; withdraw it. The lead moves to Quoted on the first send.
 */
function QuoteSendPanel({
  id,
  canSend,
  canWithdraw,
  email,
  whatsapp,
  link,
  pdfHref,
  labels,
}: QuoteSendPanelProps) {
  const uid = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function send(channel: QuoteChannel) {
    startTransition(async () => {
      const result = await sendQuote(id, channel);
      if (!result.ok) {
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? labels.failed);
        return;
      }
      toast.success(labels.sent);
      router.refresh();
    });
  }

  function withdraw() {
    setConfirming(false);
    startTransition(async () => {
      const result = await withdrawQuote(id);
      if (!result.ok) {
        toast.error(result.problem.detail ?? labels.failed);
        return;
      }
      toast.success(labels.withdrawn);
      router.refresh();
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(labels.copied);
    } catch {
      toast.error(labels.failed);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {canSend ? (
        <div className="flex flex-wrap gap-2">
          {email ? (
            <Button type="button" loading={pending} onClick={() => send("email")}>
              <Mail aria-hidden="true" />
              {labels.email}
            </Button>
          ) : null}
          {whatsapp ? (
            <Button asChild variant="whatsapp">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => send("whatsapp")}
              >
                <WhatsAppIcon className="size-4" />
                {labels.whatsapp}
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
      {canSend ? (
        <p className="text-[13.5px] text-mist-600">
          {email ? labels.emailTo.replace("{email}", email) : labels.noEmail}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={`${uid}-link`}>{labels.linkLabel}</Label>
        <Input
          id={`${uid}-link`}
          value={link}
          readOnly
          aria-describedby={`${uid}-link-hint`}
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono text-[13px]"
        />
        <p id={`${uid}-link-hint`} className="text-sm text-mist-600">
          {labels.linkHint}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void copy()}>
          <Copy aria-hidden="true" />
          {labels.copy}
        </Button>
        <Button asChild variant="secondary">
          <a href={pdfHref} target="_blank" rel="noopener">
            <FileText aria-hidden="true" />
            {labels.pdf}
          </a>
        </Button>
        {canWithdraw ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setConfirming(true)}
          >
            <Undo2 aria-hidden="true" />
            {labels.withdraw}
          </Button>
        ) : null}
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.withdraw}</AlertDialogTitle>
            <AlertDialogDescription>{labels.withdrawConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              {labels.cancel}
            </Button>
            <Button type="button" variant="danger" onClick={withdraw}>
              {labels.withdraw}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { QuoteSendPanel };
