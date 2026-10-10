"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import type { SlotFile } from "@/components/forms/DocumentSlot";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { ConsentField } from "@/components/forms/ConsentField";
import { FormField } from "@/components/forms/FormField";
import { StepActions } from "@/components/forms/StepActions";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DELIVERY_TERMS,
  TRADING_DIRECTIONS,
  buildTradingLead,
  tradingStepSchema,
  type TradingStepValues,
} from "@/lib/leads/serviceLeadForm";
import { AttachmentField } from "./AttachmentField";

type TradingRequestProps = {
  title: string;
  lead: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

const UNITS = ["cartons", "pieces", "kilograms", "tonnes", "containers"] as const;
const TIMELINES = ["a", "b", "c"] as const;

function TradingStep({
  defaultValues,
  consentText,
  sending,
  file,
  onFile,
  onBack,
  onSubmit,
}: {
  defaultValues: TradingStepValues;
  consentText: string;
  sending: boolean;
  file: SlotFile | null;
  onFile: (file: SlotFile | null) => void;
  onBack: (values: TradingStepValues) => void;
  onSubmit: (values: TradingStepValues) => void;
}) {
  const t = useTranslations("Services.trading");
  const te = useTranslations("Services.errors");
  const tl = useTranslations("Leads.errors");
  const form = useForm<TradingStepValues>({
    resolver: zodResolver(tradingStepSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const message = (key: keyof TradingStepValues) => {
    const code = errors[key]?.message;
    if (!code) return undefined;
    return code === "consentRequired" ? tl("consentRequired") : te(code as "companyRequired");
  };
  const required = <span aria-hidden="true"> *</span>;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{t("stepTitle")}</h3>
      <FormField
        id="trd-company"
        label={
          <>
            {t("company")}
            {required}
          </>
        }
        error={message("company")}
      >
        {(describedBy) => (
          <Input
            id="trd-company"
            autoComplete="organization"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("company")}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <p id="trd-direction" className="text-[14px] font-semibold text-ink-900">
          {t("direction")}
        </p>
        <Controller
          control={form.control}
          name="direction"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="trd-direction"
              value={field.value}
              onChange={field.onChange}
              options={TRADING_DIRECTIONS.map((value) => ({
                value,
                label: t(`directions.${value}`),
              }))}
            />
          )}
        />
      </div>

      <FormField
        id="trd-product"
        label={
          <>
            {t("product")}
            {required}
          </>
        }
        error={message("product")}
      >
        {(describedBy) => (
          <Input
            id="trd-product"
            placeholder={t("productPlaceholder")}
            aria-invalid={errors.product ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("product")}
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="trd-quantity"
          label={
            <>
              {t("quantity")}
              {required}
            </>
          }
          error={message("quantity")}
        >
          {(describedBy) => (
            <Input
              id="trd-quantity"
              inputMode="decimal"
              aria-invalid={errors.quantity ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("quantity")}
            />
          )}
        </FormField>
        <FormField
          id="trd-unit"
          label={
            <>
              {t("unit")}
              {required}
            </>
          }
          error={message("unit")}
        >
          {(describedBy) => (
            <Controller
              control={form.control}
              name="unit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="trd-unit"
                    className="h-[50px] w-full"
                    aria-describedby={describedBy}
                  >
                    <SelectValue>{field.value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((key) => (
                      <SelectItem key={key} value={t(`units.${key}`)}>
                        {t(`units.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </div>

      <FormField
        id="trd-country"
        label={
          <>
            {t("country")}
            {required}
          </>
        }
        error={message("country")}
      >
        {(describedBy) => (
          <Input
            id="trd-country"
            placeholder={t("countryPlaceholder")}
            aria-invalid={errors.country ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("country")}
          />
        )}
      </FormField>
      <FormField
        id="trd-specs"
        label={
          <>
            {t("specifications")}
            {required}
          </>
        }
        error={message("specifications")}
      >
        {(describedBy) => (
          <Textarea
            id="trd-specs"
            rows={3}
            maxLength={2000}
            placeholder={t("specificationsPlaceholder")}
            aria-invalid={errors.specifications ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("specifications")}
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="trd-price" label={t("targetPrice")} hint={t("targetPriceHint")}>
          {(describedBy) => (
            <Input
              id="trd-price"
              aria-describedby={describedBy}
              {...form.register("targetPrice")}
            />
          )}
        </FormField>
        <FormField id="trd-terms" label={t("deliveryTerms")} hint={t("deliveryTermsHint")}>
          {(describedBy) => (
            <Controller
              control={form.control}
              name="deliveryTerms"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="trd-terms"
                    className="h-[50px] w-full"
                    aria-describedby={describedBy}
                  >
                    <SelectValue>{field.value ? t(`terms.${field.value}`) : undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TERMS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`terms.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <p id="trd-timeline" className="text-[14px] font-semibold text-ink-900">
          {t("timeline")}
          {required}
        </p>
        <Controller
          control={form.control}
          name="timeline"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="trd-timeline"
              value={field.value}
              onChange={field.onChange}
              options={TIMELINES.map((key) => {
                const label = t(`timelines.${key}`);
                return { value: label, label };
              })}
            />
          )}
        />
        {message("timeline") ? (
          <p role="alert" className="text-[13px] text-danger-600">
            {message("timeline")}
          </p>
        ) : null}
      </div>

      <FormField id="trd-notes" label={t("notes")}>
        {(describedBy) => (
          <Textarea
            id="trd-notes"
            rows={2}
            maxLength={500}
            aria-describedby={describedBy}
            {...form.register("notes")}
          />
        )}
      </FormField>
      <AttachmentField file={file} onChange={onFile} />
      <Controller
        control={form.control}
        name="consent"
        render={({ field }) => (
          <ConsentField
            id="trd-consent"
            text={consentText}
            checked={field.value}
            onChange={field.onChange}
            inputRef={field.ref}
            error={message("consent")}
          />
        )}
      />
      <StepActions
        submitLabel={t("submit")}
        sending={sending}
        onBack={() => onBack(form.getValues())}
      />
    </form>
  );
}

/** International Trading RFQ (Trading, Trading-done): the shared two-step request, TRD reference. */
function TradingRequest(props: TradingRequestProps) {
  const t = useTranslations("Services");
  const tt = useTranslations("Services.trading");
  const [values, setValues] = useState<TradingStepValues>({
    company: "",
    direction: "import",
    product: "",
    quantity: "",
    unit: tt("units.cartons"),
    country: "",
    specifications: "",
    targetPrice: "",
    deliveryTerms: "",
    timeline: "",
    notes: "",
    consent: false,
  });
  const [file, setFile] = useState<SlotFile | null>(null);

  return (
    <LeadRequestCard<TradingStepValues>
      titleId="trading-request-title"
      kicker={tt("kicker")}
      title={props.title}
      lead={props.lead}
      secondStepLabel={tt("stepLabel")}
      contactCopy={{ title: t("contactTitle"), emailHint: t("contactEmailHint") }}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={(contact, form, page) => buildTradingLead({ contact, values: form, file, page })}
      renderSecondStep={({ sending, goBack, submit }) => (
        <TradingStep
          defaultValues={values}
          consentText={props.consentText}
          sending={sending}
          file={file}
          onFile={setFile}
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
        title: tt("success.title"),
        lead: tt("success.lead"),
        steps: [
          { title: tt("success.step1Title"), body: tt("success.step1Body") },
          { title: tt("success.step2Title"), body: tt("success.step2Body") },
          { title: tt("success.step3Title"), body: tt("success.step3Body") },
        ],
        whatsappMessage: (reference) => tt("success.whatsappMessage", { reference }),
        againHref: "/shop",
        againLabel: tt("success.again"),
      }}
    />
  );
}

export { TradingRequest };
