"use client";

import { lazyResolver } from "@/lib/forms/lazyResolver";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { FormField } from "@/components/forms/FormField";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EMI_BANK_UNSURE } from "@/lib/leads/emiLeadFormFields";
import type { EmiRequestValues, emiRequestSchema } from "@/lib/leads/emiLeadForm";
import type { EmiRequestLabels } from "./EmiRequestDialog";

// zod, the schema and the phone rules load on the form's first check, not with the page (issue 236).
const formResolver = (...args: Parameters<typeof emiRequestSchema>) =>
  lazyResolver(async () => {
    const [{ zodResolver }, { emiRequestSchema }] = await Promise.all([
      import("@hookform/resolvers/zod"),
      import("@/lib/leads/emiLeadForm"),
    ]);
    return zodResolver(emiRequestSchema(...args));
  });

type EmiRequestFormProps = {
  labels: EmiRequestLabels;
  minimum: number;
  tenures: number[];
  banks: Array<{ id: string; name: string }>;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
  /** Step 2's answers, kept by the dialog so closing and reopening it keeps them. */
  values: EmiRequestValues;
  setValues: (values: EmiRequestValues) => void;
};

type EmiStepProps = {
  labels: EmiRequestLabels;
  minimum: number;
  tenures: number[];
  banks: Array<{ id: string; name: string }>;
  consentText: string;
  defaultValues: EmiRequestValues;
  sending: boolean;
  onBack: (values: EmiRequestValues) => void;
  onSubmit: (values: EmiRequestValues) => void;
};

/** Step 2: how much, over how many months, on which bank's card, what for, and consent. */
function EmiStep({
  labels,
  minimum,
  tenures,
  banks,
  consentText,
  defaultValues,
  sending,
  onBack,
  onSubmit,
}: EmiStepProps) {
  const tLeads = useTranslations("Leads");
  const form = useForm<EmiRequestValues>({
    resolver: formResolver(minimum),
    defaultValues,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const message = (key: keyof EmiRequestValues) => {
    const code = errors[key]?.message;
    if (!code) return undefined;
    if (code in labels.errors) return labels.errors[code as keyof EmiRequestLabels["errors"]];
    return tLeads(`errors.${code}` as "errors.consentRequired");
  };
  const bankOptions = [
    ...banks.map((bank) => ({ value: bank.id, label: bank.name })),
    { value: EMI_BANK_UNSURE, label: labels.bankUnsure },
  ];

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{labels.stepTitle}</h3>
      <FormField
        id="emi-amount"
        label={labels.amount}
        hint={labels.amountHint}
        error={message("amount")}
      >
        {(describedBy) => (
          <Input
            id="emi-amount"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={describedBy}
            className="h-12 rounded-xl tabular-nums"
            {...form.register("amount")}
          />
        )}
      </FormField>
      <div className="flex flex-col gap-2">
        <p id="emi-months-label" className="text-[14px] font-semibold text-navy-900">
          {labels.months}
        </p>
        <Controller
          control={form.control}
          name="tenureMonths"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="emi-months-label"
              value={field.value}
              onChange={field.onChange}
              options={tenures.map((months) => ({
                value: String(months),
                label: labels.monthsOption.replace("{months}", String(months)),
              }))}
            />
          )}
        />
        {errors.tenureMonths ? (
          <p className="text-[13px] text-danger-600">{message("tenureMonths")}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <p id="emi-bank-label" className="text-[14px] font-semibold text-navy-900">
          {labels.bank}
        </p>
        <Controller
          control={form.control}
          name="bank"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="emi-bank-label"
              value={field.value}
              onChange={field.onChange}
              options={bankOptions}
            />
          )}
        />
        {errors.bank ? (
          <p role="alert" className="text-[13px] text-danger-600">
            {message("bank")}
          </p>
        ) : null}
      </div>
      <FormField id="emi-notes" label={labels.notes}>
        {(describedBy) => (
          <Textarea
            id="emi-notes"
            rows={2}
            maxLength={500}
            placeholder={labels.notesPlaceholder}
            aria-describedby={describedBy}
            {...form.register("notes")}
          />
        )}
      </FormField>
      <Controller
        control={form.control}
        name="consent"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="emi-consent"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "emi-consent-error" : undefined}
                className="mt-0.5"
              />
              <label
                htmlFor="emi-consent"
                className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
              >
                {consentText}
              </label>
            </div>
            {errors.consent ? (
              <p id="emi-consent-error" className="pl-8 text-[13px] text-danger-600">
                {message("consent")}
              </p>
            ) : null}
          </div>
        )}
      />
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => onBack(form.getValues())}>
          <ArrowLeft aria-hidden="true" />
          {tLeads("back")}
        </Button>
        <Button type="submit" size="lg" loading={sending}>
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}

/** The EMI request inside the dialog: the shared two-step lead card (contact, then the plan). */
function EmiRequestForm({
  labels,
  minimum,
  tenures,
  banks,
  values,
  setValues,
  ...props
}: EmiRequestFormProps) {
  const bankName = (id: string) => banks.find((bank) => bank.id === id)?.name ?? labels.bankUnsure;
  return (
    <LeadRequestCard<EmiRequestValues>
      titleId="emi-request-title"
      kicker={labels.kicker}
      title={labels.title}
      lead={labels.lead}
      secondStepLabel={labels.step}
      contactCopy={{ title: labels.contactTitle, emailHint: labels.emailHint }}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={async (contact, form, page) =>
        (await import("@/lib/leads/emiLeadForm")).buildEmiLead({
          contact,
          values: form,
          bankName: bankName(form.bank),
          page,
        })
      }
      renderSecondStep={({ sending, goBack, submit }) => (
        <EmiStep
          labels={labels}
          minimum={minimum}
          tenures={tenures}
          banks={banks}
          consentText={props.consentText}
          defaultValues={values}
          sending={sending}
          onBack={(next) => {
            setValues(next);
            goBack();
          }}
          onSubmit={(next) => {
            setValues(next);
            submit(next);
          }}
        />
      )}
      success={{
        title: labels.success.title,
        lead: labels.success.lead,
        steps: labels.success.steps,
        whatsappMessage: (reference) =>
          labels.success.whatsappMessage.replace("{reference}", reference),
        againHref: "/emi",
        againLabel: labels.success.again,
      }}
    />
  );
}

export { EmiRequestForm };
