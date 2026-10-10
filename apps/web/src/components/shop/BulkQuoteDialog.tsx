"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildBulkLead, bulkQuoteSchema, type BulkQuoteValues } from "@/lib/leads/bulkLeadForm";

export type BulkQuoteLabels = {
  kicker: string;
  title: string;
  lead: string;
  step: string;
  stepTitle: string;
  company: string;
  items: string;
  itemsPlaceholder: string;
  notes: string;
  errors: { companyRequired: string; itemsRequired: string };
  success: {
    title: string;
    lead: string;
    steps: Array<{ title: string; body: string }>;
    /** "{reference}" is replaced. */
    whatsappMessage: string;
    again: string;
  };
};

type BulkQuoteDialogProps = {
  trigger: ReactNode;
  labels: BulkQuoteLabels;
  /** Prefills the list on a product page, e.g. "Better Day CF280A, quantity: ". */
  initialItems?: string;
  productSlug?: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** Step 2 of the corporate quote: company, what is needed, notes and consent. */
function BulkStep({
  labels,
  consentText,
  defaultValues,
  sending,
  onBack,
  onSubmit,
}: {
  labels: BulkQuoteLabels;
  consentText: string;
  defaultValues: BulkQuoteValues;
  sending: boolean;
  onBack: (values: BulkQuoteValues) => void;
  onSubmit: (values: BulkQuoteValues) => void;
}) {
  const tLeads = useTranslations("Leads");
  const form = useForm<BulkQuoteValues>({
    resolver: zodResolver(bulkQuoteSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const message = (key: keyof BulkQuoteValues) => {
    const code = errors[key]?.message;
    if (!code) return undefined;
    if (code === "companyRequired" || code === "itemsRequired") return labels.errors[code];
    return tLeads(`errors.${code}` as "errors.consentRequired");
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{labels.stepTitle}</h3>
      <FormField id="bulk-company" label={labels.company} error={message("company")}>
        {(describedBy) => (
          <Input
            id="bulk-company"
            autoComplete="organization"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy}
            className="h-12 rounded-xl"
            {...form.register("company")}
          />
        )}
      </FormField>
      <FormField id="bulk-items" label={labels.items} error={message("items")}>
        {(describedBy) => (
          <Textarea
            id="bulk-items"
            rows={4}
            maxLength={1500}
            placeholder={labels.itemsPlaceholder}
            aria-invalid={errors.items ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("items")}
          />
        )}
      </FormField>
      <FormField id="bulk-notes" label={labels.notes}>
        {(describedBy) => (
          <Textarea
            id="bulk-notes"
            rows={2}
            maxLength={500}
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
                id="bulk-consent"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "bulk-consent-error" : undefined}
                className="mt-0.5"
              />
              <label
                htmlFor="bulk-consent"
                className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
              >
                {consentText}
              </label>
            </div>
            {errors.consent ? (
              <p id="bulk-consent-error" className="pl-8 text-[13px] text-danger-600">
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
          {tLeads("submit")}
        </Button>
      </div>
    </form>
  );
}

/** "Get a corporate quote" (Shop-bulk, ShopProduct-bulk): the shared two-step request in a dialog, QTE reference. */
function BulkQuoteDialog({
  trigger,
  labels,
  initialItems = "",
  productSlug,
  ...props
}: BulkQuoteDialogProps) {
  const [values, setValues] = useState<BulkQuoteValues>({
    company: "",
    items: initialItems,
    notes: "",
    consent: false,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] max-w-[min(640px,calc(100vw-24px))] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{labels.title}</DialogTitle>
        <DialogDescription className="sr-only">{labels.lead}</DialogDescription>
        <LeadRequestCard<BulkQuoteValues>
          titleId="bulk-quote-title"
          kicker={labels.kicker}
          title={labels.title}
          lead={labels.lead}
          secondStepLabel={labels.step}
          countries={props.countries}
          emailRequired={props.emailRequired}
          phoneDisplay={props.phoneDisplay}
          whatsappE164={props.whatsappE164}
          buildLead={(contact, form, page) =>
            buildBulkLead({ contact, values: form, page, ...(productSlug ? { productSlug } : {}) })
          }
          renderSecondStep={({ sending, goBack, submit }) => (
            <BulkStep
              labels={labels}
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
            againHref: "/shop",
            againLabel: labels.success.again,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export { BulkQuoteDialog };
