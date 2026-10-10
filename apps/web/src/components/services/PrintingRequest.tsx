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
import { Textarea } from "@/components/ui/textarea";
import {
  PRINTING_FREQUENCIES,
  PRINTING_SERVICES,
  buildPrintingLead,
  printingStepSchema,
  type PrintingStepValues,
} from "@/lib/leads/serviceLeadForm";
import { AttachmentField } from "./AttachmentField";

type RequestProps = {
  title: string;
  lead: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

const PRINTERS = ["a", "b", "c", "d"] as const;
const PAGES = ["a", "b", "c", "d"] as const;
const BRANCHES = ["a", "b", "c"] as const;

function PrintingStep({
  defaultValues,
  consentText,
  sending,
  file,
  onFile,
  onBack,
  onSubmit,
}: {
  defaultValues: PrintingStepValues;
  consentText: string;
  sending: boolean;
  file: SlotFile | null;
  onFile: (file: SlotFile | null) => void;
  onBack: (values: PrintingStepValues) => void;
  onSubmit: (values: PrintingStepValues) => void;
}) {
  const t = useTranslations("Services.printing");
  const te = useTranslations("Services.errors");
  const tl = useTranslations("Leads.errors");
  const form = useForm<PrintingStepValues>({
    resolver: zodResolver(printingStepSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const message = (key: keyof PrintingStepValues) => {
    const code = errors[key]?.message;
    if (!code) return undefined;
    return code === "consentRequired" ? tl("consentRequired") : te(code as "companyRequired");
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{t("stepTitle")}</h3>
      <FormField id="prn-company" label={t("company")} error={message("company")}>
        {(describedBy) => (
          <Input
            id="prn-company"
            autoComplete="organization"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("company")}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <p id="prn-service" className="text-[14px] font-semibold text-ink-900">
          {t("service")}
        </p>
        <Controller
          control={form.control}
          name="service"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="prn-service"
              value={field.value}
              onChange={field.onChange}
              options={PRINTING_SERVICES.map((value) => ({ value, label: t(`services.${value}`) }))}
            />
          )}
        />
      </div>

      {(
        [
          ["printers", "printersOptions", PRINTERS],
          ["pages", "pagesOptions", PAGES],
          ["branches", "branchesOptions", BRANCHES],
        ] as const
      ).map(([name, optionsKey, keys]) => (
        <div key={name} className="flex flex-col gap-2">
          <p id={`prn-${name}`} className="text-[14px] font-semibold text-ink-900">
            {t(name)}
          </p>
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <ChipRadioGroup
                labelledBy={`prn-${name}`}
                value={field.value}
                onChange={field.onChange}
                options={keys.map((key) => {
                  const label = t(`${optionsKey}.${key}` as "printersOptions.a");
                  return { value: label, label };
                })}
              />
            )}
          />
          {message(name) ? (
            <p role="alert" className="text-[13px] text-danger-600">
              {message(name)}
            </p>
          ) : null}
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <p id="prn-frequency" className="text-[14px] font-semibold text-ink-900">
          {t("frequency")}
        </p>
        <Controller
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="prn-frequency"
              value={field.value}
              onChange={field.onChange}
              options={PRINTING_FREQUENCIES.map((value) => ({
                value,
                label: t(`frequencies.${value}`),
              }))}
            />
          )}
        />
      </div>

      <FormField id="prn-location" label={t("location")} error={message("location")}>
        {(describedBy) => (
          <Input
            id="prn-location"
            placeholder={t("locationPlaceholder")}
            aria-invalid={errors.location ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("location")}
          />
        )}
      </FormField>
      <FormField
        id="prn-models"
        label={
          <>
            {t("models")} <span className="font-normal text-mist-600">{t("modelsOptional")}</span>
          </>
        }
      >
        {(describedBy) => (
          <Textarea
            id="prn-models"
            rows={3}
            maxLength={500}
            placeholder={t("modelsPlaceholder")}
            aria-describedby={describedBy}
            {...form.register("models")}
          />
        )}
      </FormField>
      <FormField id="prn-notes" label={t("notes")}>
        {(describedBy) => (
          <Textarea
            id="prn-notes"
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
            id="prn-consent"
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

/** Printing Solutions quote (Printing, Printing-done): the shared two-step request, PRN reference. */
function PrintingRequest(props: RequestProps) {
  const t = useTranslations("Services");
  const tp = useTranslations("Services.printing");
  const [values, setValues] = useState<PrintingStepValues>({
    company: "",
    service: "toner-supply",
    printers: "",
    pages: "",
    branches: "",
    frequency: "monthly",
    location: "",
    models: "",
    notes: "",
    consent: false,
  });
  const [file, setFile] = useState<SlotFile | null>(null);

  return (
    <LeadRequestCard<PrintingStepValues>
      titleId="printing-request-title"
      kicker={tp("kicker")}
      title={props.title}
      lead={props.lead}
      secondStepLabel={tp("stepLabel")}
      contactCopy={{ title: t("contactTitle"), emailHint: t("contactEmailHint") }}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={(contact, form, page) =>
        buildPrintingLead({
          contact,
          values: form,
          file,
          page,
          labels: {
            printers: tp("printers"),
            pages: tp("pages"),
            branches: tp("branches"),
            models: tp("models"),
          },
        })
      }
      renderSecondStep={({ sending, goBack, submit }) => (
        <PrintingStep
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
        title: tp("success.title"),
        lead: tp("success.lead"),
        steps: [
          { title: tp("success.step1Title"), body: tp("success.step1Body") },
          { title: tp("success.step2Title"), body: tp("success.step2Body") },
          { title: tp("success.step3Title"), body: tp("success.step3Body") },
        ],
        whatsappMessage: (reference) => tp("success.whatsappMessage", { reference }),
        againHref: "/shop",
        againLabel: tp("success.again"),
      }}
    />
  );
}

export { PrintingRequest };
