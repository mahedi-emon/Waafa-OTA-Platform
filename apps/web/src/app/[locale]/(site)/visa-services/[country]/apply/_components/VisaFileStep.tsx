"use client";

import { useId, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { formatDate, formatTaka, type VisaTypeKey } from "@waafa/shared";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { FormField } from "@/components/forms/FormField";
import { NumberStepper } from "@/components/forms/NumberStepper";
import { useDhakaToday } from "@/components/search/useDhakaToday";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DOCUMENT_SLOTS,
  MAX_VISA_APPLICANTS,
  visaFees,
  visaFileSchema,
  type VisaFileInput,
  type VisaFileValues,
} from "@/lib/leads/visaLeadForm";
import { addDays, formatFieldDate } from "@/lib/search/isoDate";
import { DocumentSlot } from "./DocumentSlot";

export type VisaTypeOption = {
  type: VisaTypeKey;
  label: string;
  embassyFee: number | null;
  serviceCharge: number;
};

type VisaFileStepProps = {
  countryName: string;
  types: VisaTypeOption[];
  /** Office days, 0 = Sunday (admin office hours); a visit can be booked on the next six of them. */
  officeDays: number[];
  officeAddress: string;
  consentText: string;
  defaultValues: VisaFileInput;
  sending: boolean;
  onBack: (values: VisaFileInput) => void;
  onSubmit: (values: VisaFileValues) => void;
};

/** A titled block inside the step. */
function Block({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 border-t border-mist-200 pt-5 first:border-t-0 first:pt-0"
    >
      <div>
        <h4 id={id} className="font-display text-[17px] font-bold text-navy-900">
          {title}
        </h4>
        {lead ? <div className="text-[14px] text-mist-600">{lead}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** The next `count` office days after `today` (YYYY-MM-DD, Asia/Dhaka). */
function nextOfficeDays(today: string, officeDays: number[], count: number): string[] {
  const days: string[] = [];
  for (let offset = 1; days.length < count && offset < 30; offset += 1) {
    const day = addDays(today, offset);
    if (officeDays.includes(new Date(`${day}T00:00:00Z`).getUTCDay())) days.push(day);
  }
  return days;
}

/** Visa application step 2 (VisaApply-2 to -4): trip, documents, optional office visit, then check and send. */
function VisaFileStep(props: VisaFileStepProps) {
  const t = useTranslations("Visa");
  const tLeads = useTranslations("Leads");
  const id = useId();
  const today = useDhakaToday();
  const form = useForm<VisaFileInput, unknown, VisaFileValues>({
    resolver: (values, context, options) =>
      zodResolver(visaFileSchema(today || "1970-01-01"))(values, context, options),
    defaultValues: props.defaultValues,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const [visaType, applicants, travelDate, documents, visit, appointmentDate] = useWatch({
    control: form.control,
    name: ["visaType", "applicants", "travelDate", "documents", "visit", "appointmentDate"],
  });
  const message = (key: keyof VisaFileInput) => {
    const code = errors[key]?.message;
    if (!code) return undefined;
    return t.has(`errors.${code}` as "errors.travelDateRequired")
      ? t(`errors.${code}` as "errors.travelDateRequired")
      : tLeads(`errors.${code}` as "errors.consentRequired");
  };
  const selected = props.types.find((option) => option.type === visaType) ?? props.types[0];
  const fees = selected ? visaFees(selected, applicants) : null;
  const visitDays = today ? nextOfficeDays(today, props.officeDays, 6) : [];
  const errorCount = Object.keys(errors).length;

  return (
    <form noValidate onSubmit={form.handleSubmit(props.onSubmit)} className="flex flex-col gap-6">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{t("apply.stepTitle")}</h3>
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && errorCount > 0 ? tLeads("errors.summary", { count: errorCount }) : ""}
      </p>

      <Block id={`${id}-trip`} title={t("apply.trip")}>
        <p id={`${id}-type`} className="text-[14px] font-semibold text-ink-900">
          {t("apply.visaType")}
        </p>
        <Controller
          control={form.control}
          name="visaType"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy={`${id}-type`}
              value={field.value}
              onChange={field.onChange}
              options={props.types.map((option) => ({ value: option.type, label: option.label }))}
            />
          )}
        />
        <FormField id="visa-travel" label={t("apply.travelDate")} error={message("travelDate")}>
          {(describedBy) => (
            <Input
              id="visa-travel"
              type="date"
              min={today || undefined}
              aria-invalid={errors.travelDate ? true : undefined}
              aria-describedby={describedBy}
              className="h-12 max-w-xs rounded-xl"
              {...form.register("travelDate")}
            />
          )}
        </FormField>
        <div className="rounded-xl border border-mist-200 px-4">
          <Controller
            control={form.control}
            name="applicants"
            render={({ field }) => (
              <NumberStepper
                label={t("apply.applicants")}
                sub={t("apply.applicantsSub")}
                value={field.value}
                min={1}
                max={MAX_VISA_APPLICANTS}
                onChange={field.onChange}
                labels={{ decrease: t("apply.decrease"), increase: t("apply.increase") }}
              />
            )}
          />
        </div>
      </Block>

      <Block id={`${id}-docs`} title={t("apply.documents")} lead={t("apply.documentsLead")}>
        <p className="flex gap-2 rounded-xl bg-navy-900 px-4 py-3 text-[13.5px] leading-relaxed text-white">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-400" />
          <span>
            {t("apply.private")} {t("apply.phaseNote")}
          </span>
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-ink-900">{t("apply.applicant")}</p>
          <p className="text-[13px] text-mist-600 tabular-nums">
            {t("apply.uploaded", { count: documents.length, total: DOCUMENT_SLOTS.length })}
          </p>
        </div>
        <Controller
          control={form.control}
          name="documents"
          render={({ field }) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {DOCUMENT_SLOTS.map((slot) => {
                const current = field.value.find((document) => document.slot === slot) ?? null;
                return (
                  <DocumentSlot
                    key={slot}
                    title={t(`apply.slots.${slot}`)}
                    sub={t(`apply.slots.${slot}Sub`)}
                    file={current}
                    onChange={(file) =>
                      field.onChange([
                        ...field.value.filter((document) => document.slot !== slot),
                        ...(file ? [{ slot, ...file }] : []),
                      ])
                    }
                    labels={{
                      choose: t("apply.choose"),
                      rule: t("apply.fileRule"),
                      replace: t("apply.replace"),
                      remove: t("apply.remove", { file: "{file}" }),
                      added: t("apply.added"),
                      errors: {
                        fileType: t("errors.fileType"),
                        fileSize: t("errors.fileSize"),
                        fileEmpty: t("errors.fileEmpty"),
                      },
                    }}
                  />
                );
              })}
            </div>
          )}
        />
        {applicants > 1 ? (
          <p className="rounded-xl border border-dashed border-mist-300 px-4 py-3 text-[14px] text-mist-700">
            <span className="font-semibold text-navy-900">{t("apply.others")}. </span>
            {t("apply.othersBody")}
          </p>
        ) : null}
      </Block>

      <Block id={`${id}-visit`} title={t("apply.visit")}>
        <Controller
          control={form.control}
          name="visit"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-mist-200 px-4 py-3">
              <span>
                <span className="block text-[15px] font-semibold text-navy-900">
                  {t("apply.visitSub")}
                </span>
                <span className="block text-[13px] text-mist-600">{props.officeAddress}</span>
              </span>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label={t("apply.visit")}
              />
            </label>
          )}
        />
        {visit ? (
          <>
            <p id={`${id}-day`} className="text-[14px] font-semibold text-ink-900">
              {t("apply.visitDay")}
            </p>
            <Controller
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <ChipRadioGroup
                  labelledBy={`${id}-day`}
                  value={field.value}
                  onChange={field.onChange}
                  options={visitDays.map((day) => ({ value: day, label: formatFieldDate(day) }))}
                />
              )}
            />
            {errors.appointmentDate ? (
              <p className="text-[13px] text-danger-600">{message("appointmentDate")}</p>
            ) : null}
            <p id={`${id}-time`} className="text-[14px] font-semibold text-ink-900">
              {t("apply.visitTime")}
            </p>
            <Controller
              control={form.control}
              name="appointmentWindow"
              render={({ field }) => (
                <ChipRadioGroup
                  labelledBy={`${id}-time`}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "morning", label: t("apply.morning") },
                    { value: "afternoon", label: t("apply.afternoon") },
                  ]}
                />
              )}
            />
          </>
        ) : null}
        <FormField id="visa-notes" label={t("apply.notes")}>
          {(describedBy) => (
            <Textarea
              id="visa-notes"
              rows={3}
              maxLength={1000}
              aria-describedby={describedBy}
              {...form.register("notes")}
            />
          )}
        </FormField>
      </Block>

      <Block id={`${id}-review`} title={t("apply.review")} lead={t("apply.reviewLead")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-2xl bg-mist-50 p-4 text-[14.5px] sm:grid-cols-2">
          {[
            [t("apply.summaryVisa"), `${props.countryName} · ${selected?.label ?? ""}`],
            [t("apply.summaryApplicants"), String(applicants)],
            [
              t("apply.summaryTravel"),
              /^\d{4}-\d{2}-\d{2}$/.test(travelDate)
                ? formatDate(travelDate)
                : t("apply.notChosen"),
            ],
            [
              t("apply.summaryDocuments"),
              t("apply.summaryDocumentsValue", { count: documents.length }),
            ],
            ...(visit && appointmentDate
              ? [[t("apply.visit"), formatFieldDate(appointmentDate)]]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 sm:flex-col sm:justify-start">
              <dt className="text-mist-600">{label}</dt>
              <dd className="text-right font-semibold text-navy-900 sm:text-left">{value}</dd>
            </div>
          ))}
        </dl>
        {fees ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-mist-200 p-4 text-[14.5px]">
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between gap-3">
                <dt className="text-mist-700">{t("apply.embassyTimes", { count: applicants })}</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {fees.embassy === null ? t("country.confirmedLater") : formatTaka(fees.embassy)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mist-700">{t("apply.serviceTimes", { count: applicants })}</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {formatTaka(fees.service)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-mist-200 pt-2">
                <dt className="font-semibold text-navy-900">{t("apply.total")}</dt>
                <dd className="font-display text-[18px] font-extrabold text-navy-900 tabular-nums">
                  {fees.total === null ? `${formatTaka(fees.service)} +` : formatTaka(fees.total)}
                </dd>
              </div>
            </dl>
            <p className="pt-1 text-[13px] text-mist-600">{t("apply.payNote")}</p>
          </div>
        ) : null}
        <Controller
          control={form.control}
          name="consent"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="visa-consent"
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "visa-consent-error" : undefined}
                  className="mt-0.5"
                />
                <label
                  htmlFor="visa-consent"
                  className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
                >
                  {props.consentText}
                </label>
              </div>
              {errors.consent ? (
                <p id="visa-consent-error" className="pl-8 text-[13px] text-danger-600">
                  {message("consent")}
                </p>
              ) : null}
            </div>
          )}
        />
      </Block>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => props.onBack(form.getValues())}>
          <ArrowLeft aria-hidden="true" />
          {tLeads("back")}
        </Button>
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <Button type="submit" size="lg" loading={props.sending}>
            {tLeads("submit")}
          </Button>
          <p className="text-center text-[13px] font-semibold text-success-600 sm:text-right">
            {tLeads("noPayment")}
          </p>
        </div>
      </div>
    </form>
  );
}

export { VisaFileStep };
