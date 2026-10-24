"use client";

import { useTransition } from "react";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { leadAction } from "@/lib/admin/leadActions";

type LeadContactButtonsProps = {
  leadId: string;
  phone: string;
  /** wa.me link with the greeting written. */
  whatsappHref: string;
  strings: { call: string; whatsapp: string; logged: string; failed: string };
};

/**
 * Call and WhatsApp from a list row, a phone card or a board card (D0 R6): the link opens as usual and the contact
 * is logged on the way, exactly like the lead page's buttons (D220), so a new lead moves to In progress.
 */
function LeadContactButtons({ leadId, phone, whatsappHref, strings }: LeadContactButtonsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const log = (channel: "call" | "whatsapp") =>
    startTransition(async () => {
      const result = await leadAction(leadId, { type: "contact", channel });
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      toast.success(strings.logged);
      router.refresh();
    });
  return (
    <>
      <Button asChild variant="secondary" size="sm">
        <a href={`tel:${phone}`} onClick={() => log("call")}>
          <Phone aria-hidden="true" className="size-4" />
          {strings.call}
        </a>
      </Button>
      <Button asChild variant="whatsapp" size="sm">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => log("whatsapp")}
        >
          <WhatsAppIcon className="size-4" />
          {strings.whatsapp}
        </a>
      </Button>
    </>
  );
}

export { LeadContactButtons };
