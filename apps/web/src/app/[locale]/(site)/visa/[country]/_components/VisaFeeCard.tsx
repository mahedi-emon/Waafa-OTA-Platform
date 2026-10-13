"use client";

import { whatsappLink, type VisaPrice, type VisaTypeKey } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatVisaPrice } from "@/lib/visa/visaPrice";
import { useVisaType } from "./useVisaType";

export type VisaFee = {
  type: VisaTypeKey;
  label: string;
  /** Per applicant, all in: a range, or a starting price (issue 179). */
  price: VisaPrice;
};

type VisaFeeCardProps = {
  slug: string;
  fees: VisaFee[];
  whatsappE164: string;
  sample: boolean;
  labels: {
    /** "{type}" is replaced with the visa type label. */
    title: string;
    perApplicant: string;
    price: string;
    /** "{price}" is replaced. */
    priceFrom: string;
    priceNote: string;
    apply: string;
    whatsapp: string;
    /** "{type}" is replaced with the visa type label. */
    whatsappMessage: string;
    payLater: string;
    sample: string;
  };
};

/**
 * Fee card (VisaCountry aside): the chosen type's price per applicant as a range or a starting price, never one fixed
 * figure (issue 179), with what it includes, then Apply.
 */
function VisaFeeCard({ slug, fees, whatsappE164, sample, labels }: VisaFeeCardProps) {
  const { type } = useVisaType();
  const fee = fees.find((item) => item.type === type) ?? fees[0];
  if (!fee) return null;

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-mist-200 bg-white p-5 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[17px] font-bold text-navy-900">
          {labels.title.replace("{type}", fee.label)}
        </h2>
        <span className="shrink-0 text-[12.5px] text-mist-600">{labels.perApplicant}</span>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-mist-200 pt-3">
        <p className="text-[13.5px] font-semibold text-mist-700">{labels.price}</p>
        <p
          aria-live="polite"
          className="font-display text-[24px] leading-tight font-extrabold text-navy-900 tabular-nums"
        >
          {formatVisaPrice(fee.price, labels.priceFrom)}
        </p>
        <p className="text-[13px] leading-snug text-mist-600">{labels.priceNote}</p>
      </div>
      {sample ? (
        <p className="text-[12.5px] font-semibold text-warning-700">{labels.sample}</p>
      ) : null}
      <Button asChild size="lg">
        <Link href={`/visa/${slug}/apply?type=${fee.type}`}>{labels.apply}</Link>
      </Button>
      <Button asChild size="lg" variant="whatsapp">
        <a
          href={whatsappLink(
            whatsappE164,
            labels.whatsappMessage.replace("{type}", fee.label.toLowerCase()),
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon className="size-5" />
          {labels.whatsapp}
        </a>
      </Button>
      <p className="text-center text-[13px] font-semibold text-success-600">{labels.payLater}</p>
    </div>
  );
}

export { VisaFeeCard };
