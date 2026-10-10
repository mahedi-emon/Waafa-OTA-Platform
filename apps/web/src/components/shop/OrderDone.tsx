"use client";

import { ArrowRight, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatTaka, whatsappLink } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LeadSuccess } from "@/components/leads/LeadSuccess";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { OfflineAccount } from "./PaymentOptions";

type OrderDoneProps = {
  reference: string;
  total: number;
  phoneDisplay: string;
  email?: string;
  pickup: boolean;
  estimate: string;
  /** The account the customer chose to pay into, or null for cash on delivery. */
  account: OfflineAccount | null;
  transactionId?: string;
  whatsappE164: string;
};

/** Order placed (ShopDone, ShopDone-bank): the boarding-pass card with the ORD number, what happens next, and track. */
function OrderDone({
  reference,
  total,
  phoneDisplay,
  email,
  pickup,
  estimate,
  account,
  transactionId,
  whatsappE164,
}: OrderDoneProps) {
  const t = useTranslations("Checkout.done");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <LeadSuccess
        title={t("title")}
        lead={t("lead")}
        reference={reference}
        labels={{
          reference: t("reference"),
          copy: t("copy"),
          copied: t("copied"),
          copyFailed: t("copyFailed"),
        }}
        steps={[
          {
            title: t("step1Title"),
            body: account
              ? t("step1Offline", { trx: transactionId ?? "" })
              : t("step1Cod", { phone: phoneDisplay }),
          },
          { title: t("step2Title"), body: t("step2Body") },
          {
            title: t("step3Title"),
            body: pickup ? t("step3Pickup") : t("step3Body", { estimate }),
          },
        ]}
        actions={
          <>
            <Button asChild>
              <Link href="/shop/track">
                <Truck aria-hidden="true" />
                {t("track")}
              </Link>
            </Button>
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(whatsappE164, t("whatsappMessage", { reference }))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                {t("whatsapp")}
              </a>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/shop">
                {t("continue")}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
        footnote={email ? t("email", { email }) : undefined}
      />
      {account ? (
        <section
          aria-labelledby="done-pay-title"
          className="rounded-2xl border border-electric-100 bg-electric-50 p-4"
        >
          <h3 id="done-pay-title" className="font-display text-[16px] font-bold text-navy-900">
            {t("payTitle", { total: formatTaka(total) })}
          </h3>
          <p className="mt-1 text-[14.5px] font-semibold text-ink-900">{account.title}</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-[14px] text-ink-900">
            {account.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export { OrderDone };
