"use client";

import { useEffect, useState } from "react";
import { House, Phone, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { whatsappLink } from "@waafa/shared";
import { useSupportContact } from "@/components/feedback/SupportContact";
import { SystemState } from "@/components/feedback/SystemState";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type SiteErrorProps = { error: Error & { digest?: string }; reset: () => void };

/**
 * The 500 state (Error500 board) inside the site frame: nothing the visitor typed is lost, they can try again, and the
 * error ID (the server digest when there is one) is quoted when they call or WhatsApp.
 */
export default function SiteError({ error, reset }: SiteErrorProps) {
  const t = useTranslations("Errors.error");
  const contact = useSupportContact();
  const [fallbackId] = useState(() => `WEB-${Date.now().toString(36).toUpperCase()}`);
  const code = error.digest ?? fallbackId;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="site-container flex flex-1 flex-col pt-4 pb-28">
      <SystemState
        role="alert"
        code={t("code")}
        title={t("title")}
        lead={t("lead")}
        actions={
          <>
            <Button type="button" size="lg" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              {t("retry")}
            </Button>
            {contact ? (
              <>
                <Button asChild size="lg" variant="whatsapp">
                  <a
                    href={whatsappLink(contact.whatsappE164, t("whatsappMessage", { code }))}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon />
                    {t("whatsapp")}
                  </a>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <a href={`tel:${contact.phoneE164}`}>
                    <Phone aria-hidden="true" />
                    {t("call", { phone: contact.phoneDisplay })}
                  </a>
                </Button>
              </>
            ) : null}
            <Button asChild size="lg" variant="ghost">
              <Link href="/">
                <House aria-hidden="true" />
                {t("home")}
              </Link>
            </Button>
          </>
        }
      >
        <p className="rounded-xl bg-mist-50 px-4 py-3 text-[14px] text-mist-700">
          {t("id")} ·{" "}
          <span className="font-mono font-semibold tracking-wide text-navy-900">{code}</span>
        </p>
      </SystemState>
    </main>
  );
}
