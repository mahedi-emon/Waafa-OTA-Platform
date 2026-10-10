"use client";

import { useId, useState } from "react";
import { formatTaka, whatsappLink } from "@waafa/shared";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { EMI_MAX_AMOUNT, EMI_STEP, clampEmiAmount, emiPlan } from "@/lib/shop/emi";

type EmiCalculatorProps = {
  minimum: number;
  tenures: number[];
  /** Shown as the interest row only when the admin says the tenures are interest-free. */
  interestFree: boolean;
  whatsappE164: string;
  labels: {
    title: string;
    amount: string;
    /** "{amount}" is replaced. */
    amountValue: string;
    months: string;
    /** "{months}" is replaced. */
    monthsOption: string;
    perMonth: string;
    /** "{months}" is replaced. */
    times: string;
    rows: { amount: string; interest: string; fee: string; feeValue: string; total: string };
    ask: string;
    /** "{amount}" and "{months}" are replaced. */
    askMessage: string;
  };
};

/** EMI calculator (Emi board): amount slider, tenure chips, the monthly amount and the totals; asks on WhatsApp. */
function EmiCalculator({
  minimum,
  tenures,
  interestFree,
  whatsappE164,
  labels,
}: EmiCalculatorProps) {
  const id = useId();
  const [amount, setAmount] = useState(() => clampEmiAmount(100_000, minimum));
  const [months, setMonths] = useState(() => tenures[1] ?? tenures[0] ?? 6);
  const plan = emiPlan(amount, months);

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-5 rounded-[24px] border border-mist-200 bg-white p-5 shadow-sm md:p-7"
    >
      <h2 id={`${id}-title`} className="font-display text-[19px] font-extrabold text-navy-900">
        {labels.title}
      </h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p id={`${id}-amount`} className="text-[14px] font-semibold text-ink-900">
            {labels.amount}
          </p>
          <output
            htmlFor={`${id}-slider`}
            className="font-display text-[22px] font-extrabold text-navy-900 tabular-nums"
          >
            {formatTaka(amount)}
          </output>
        </div>
        <Slider
          id={`${id}-slider`}
          thumbLabels={[labels.amount]}
          min={minimum}
          max={EMI_MAX_AMOUNT}
          step={EMI_STEP}
          value={[amount]}
          onValueChange={([next]) => setAmount(clampEmiAmount(next ?? minimum, minimum))}
          className="py-3"
        />
        <div className="flex justify-between text-[12.5px] text-mist-600 tabular-nums">
          <span>{formatTaka(minimum)}</span>
          <span>{formatTaka(EMI_MAX_AMOUNT)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p id={`${id}-months`} className="text-[14px] font-semibold text-ink-900">
          {labels.months}
        </p>
        <ChipRadioGroup
          labelledBy={`${id}-months`}
          value={String(months)}
          onChange={(value) => setMonths(Number(value))}
          options={tenures.map((value) => ({
            value: String(value),
            label: labels.monthsOption.replace("{months}", String(value)),
          }))}
        />
      </div>
      <div className="flex flex-col gap-1 rounded-2xl bg-navy-900 p-5 text-white">
        <p className="text-[13.5px] text-white/75">{labels.perMonth}</p>
        <p aria-live="polite" className="flex items-baseline gap-2">
          <span className="font-display text-[34px] leading-none font-extrabold tabular-nums">
            {formatTaka(plan.monthly)}
          </span>
          <span className="text-[14px] text-white/75">
            {labels.times.replace("{months}", String(months))}
          </span>
        </p>
      </div>
      <dl className="flex flex-col gap-2 text-[14.5px]">
        <div className="flex justify-between gap-3">
          <dt className="text-mist-700">{labels.rows.amount}</dt>
          <dd className="font-semibold tabular-nums">{formatTaka(plan.total)}</dd>
        </div>
        {interestFree ? (
          <div className="flex justify-between gap-3">
            <dt className="text-mist-700">{labels.rows.interest}</dt>
            <dd className="font-semibold tabular-nums">{formatTaka(0)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-mist-700">{labels.rows.fee}</dt>
          <dd className="font-medium text-mist-700">{labels.rows.feeValue}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-mist-200 pt-2">
          <dt className="font-semibold text-navy-900">{labels.rows.total}</dt>
          <dd className="font-display font-extrabold text-navy-900 tabular-nums">
            {formatTaka(plan.total)}
          </dd>
        </div>
      </dl>
      <Button asChild size="lg" variant="whatsapp">
        <a
          href={whatsappLink(
            whatsappE164,
            labels.askMessage
              .replace("{amount}", formatTaka(amount))
              .replace("{months}", String(months)),
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          {labels.ask}
        </a>
      </Button>
    </section>
  );
}

export { EmiCalculator };
