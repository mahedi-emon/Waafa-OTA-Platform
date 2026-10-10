"use client";

import { formatTaka } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { VisaFee } from "./VisaFeeCard";
import { useVisaType } from "./useVisaType";

type VisaFeeBarProps = {
  slug: string;
  fees: VisaFee[];
  /** "{type}" and "{total}" are replaced. */
  labels: { line: string; total: string; apply: string };
};

/** Phone bar (VisaCountry-m): the chosen type's total per applicant and Apply, above the tab bar. */
function VisaFeeBar({ slug, fees, labels }: VisaFeeBarProps) {
  const { type } = useVisaType();
  const fee = fees.find((item) => item.type === type) ?? fees[0];
  if (!fee) return null;
  const total =
    fee.embassyFee === null
      ? `${formatTaka(fee.serviceCharge)} +`
      : formatTaka(fee.embassyFee + fee.serviceCharge);

  return (
    <div
      data-bottom-bar=""
      className="fixed inset-x-0 bottom-(--tab-space) z-30 border-t border-mist-200 bg-white/95 px-4 py-2.5 shadow-[0_-12px_28px_-22px_rgb(2_13_57/0.35)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="min-w-0 leading-tight">
          <span className="block truncate text-[12px] text-mist-600">
            {labels.line.replace("{type}", fee.label)}
          </span>
          <span className="font-display text-[18px] font-extrabold text-navy-900 tabular-nums">
            {labels.total.replace("{total}", total)}
          </span>
        </p>
        <Button asChild className="shrink-0">
          <Link href={`/visa-services/${slug}/apply?type=${fee.type}`}>{labels.apply}</Link>
        </Button>
      </div>
    </div>
  );
}

export { VisaFeeBar };
