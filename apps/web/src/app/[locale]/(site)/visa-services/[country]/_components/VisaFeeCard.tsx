"use client";

import { formatTaka, whatsappLink, type VisaTypeKey } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useVisaType } from "./useVisaType";

export type VisaFee = {
  type: VisaTypeKey;
  label: string;
  embassyFee: number | null;
  serviceCharge: number;
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
    embassyFee: string;
    serviceCharge: string;
    total: string;
    confirmedLater: string;
    apply: string;
    whatsapp: string;
    /** "{type}" is replaced with the visa type label. */
    whatsappMessage: string;
    payLater: string;
    sample: string;
  };
};

/** Fee card (VisaCountry aside): embassy fee and our service charge for the chosen type, then Apply. */
function VisaFeeCard({ slug, fees, whatsappE164, sample, labels }: VisaFeeCardProps) {
  const { type } = useVisaType();
  const fee = fees.find((item) => item.type === type) ?? fees[0];
  if (!fee) return null;
  const total = fee.embassyFee === null ? null : fee.embassyFee + fee.serviceCharge;

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-mist-200 bg-white p-5 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[17px] font-bold text-navy-900">
          {labels.title.replace("{type}", fee.label)}
        </h2>
        <span className="shrink-0 text-[12.5px] text-mist-600">{labels.perApplicant}</span>
      </div>
      <dl className="flex flex-col gap-2.5 text-[14.5px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-mist-700">{labels.embassyFee}</dt>
          <dd className="text-right font-semibold whitespace-nowrap text-ink-900 tabular-nums">
            {fee.embassyFee === null ? labels.confirmedLater : formatTaka(fee.embassyFee)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-mist-700">{labels.serviceCharge}</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">
            {formatTaka(fee.serviceCharge)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-mist-200 pt-2.5">
          <dt className="font-semibold text-navy-900">{labels.total}</dt>
          <dd
            aria-live="polite"
            className="font-display text-[20px] font-extrabold text-navy-900 tabular-nums"
          >
            {total === null ? `${formatTaka(fee.serviceCharge)} +` : formatTaka(total)}
          </dd>
        </div>
      </dl>
      {sample ? (
        <p className="text-[12.5px] font-semibold text-warning-700">{labels.sample}</p>
      ) : null}
      <Button asChild size="lg">
        <Link href={`/visa-services/${slug}/apply?type=${fee.type}`}>{labels.apply}</Link>
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
