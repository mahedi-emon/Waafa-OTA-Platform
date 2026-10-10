"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { cn } from "cn";
import { FormField } from "@/components/forms/FormField";
import { NumberStepper } from "@/components/forms/NumberStepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  packageQuerySchema,
  type PackageQueryInput,
  type PackageQueryValues,
} from "@/lib/leads/packageLeadForm";

type QueryStepProps = {
  defaultValues: PackageQueryInput;
  departures: Array<{ value: string; label: string }>;
  sharings: Array<{ value: string; label: string }>;
  consentText: string;
  sending: boolean;
  onBack: (values: PackageQueryInput) => void;
  onSubmit: (values: PackageQueryValues) => void;
};

/** Package query step 2 (PackageDetail-query): departure, travellers, room sharing, contact, notes and consent. */
function QueryStep({
  defaultValues,
  departures,
  sharings,
  consentText,
  sending,
  onBack,
  onSubmit,
}: QueryStepProps) {
  const t = useTranslations("Packages");
  const tLeads = useTranslations("Leads");
  const id = useId();
  const form = useForm<PackageQueryInput, unknown, PackageQueryValues>({
    resolver: zodResolver(packageQuerySchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const error = (key: keyof PackageQueryInput) => {
    const message = errors[key]?.message;
    if (!message) return undefined;
    return t.has(`errors.${message}` as "errors.departureRequired")
      ? t(`errors.${message}` as "errors.departureRequired")
      : tLeads(`errors.${message}` as "errors.consentRequired");
  };
  const errorCount = Object.keys(errors).length;
  const stepper = (name: "adults" | "children" | "infants", min: number, max: number) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <NumberStepper
          label={t(`query.${name}`)}
          sub={t(`query.${name}Sub`)}
          value={field.value}
          min={min}
          max={max}
          onChange={field.onChange}
          labels={{
            decrease: t("query.decrease", { label: t(`query.${name}`) }),
            increase: t("query.increase", { label: t(`query.${name}`) }),
          }}
        />
      )}
    />
  );

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{t("query.stepTitle")}</h3>
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && errorCount > 0 ? tLeads("errors.summary", { count: errorCount }) : ""}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="query-departure" label={t("query.departure")} error={error("departure")}>
          {(describedBy) => (
            <Controller
              control={form.control}
              name="departure"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="query-departure"
                    ref={field.ref}
                    aria-invalid={errors.departure ? true : undefined}
                    aria-describedby={describedBy}
                    className="h-12 w-full rounded-xl"
                  >
                    <SelectValue>
                      {departures.find((departure) => departure.value === field.value)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departures.map((departure) => (
                      <SelectItem key={departure.value} value={departure.value}>
                        {departure.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <FormField id="query-sharing" label={t("query.roomSharing")}>
          {() => (
            <Controller
              control={form.control}
              name="roomSharing"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="query-sharing"
                    ref={field.ref}
                    className="h-12 w-full rounded-xl"
                  >
                    <SelectValue>
                      {sharings.find((sharing) => sharing.value === field.value)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sharings.map((sharing) => (
                      <SelectItem key={sharing.value} value={sharing.value}>
                        {sharing.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </div>
      <div className="divide-y divide-mist-200 rounded-xl border border-mist-200 px-4">
        {stepper("adults", 1, 40)}
        {stepper("children", 0, 20)}
        {stepper("infants", 0, 20)}
      </div>
      {errors.infants ? (
        <p className="-mt-3 text-[13px] text-danger-600">{error("infants")}</p>
      ) : null}

      <fieldset>
        <legend id={`${id}-contact`} className="mb-2 text-[14px] font-semibold text-ink-900">
          {t("query.contactBy")}
        </legend>
        <Controller
          control={form.control}
          name="preferredContact"
          render={({ field }) => (
            <RadioGroup
              aria-labelledby={`${id}-contact`}
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-3 gap-2"
            >
              {(
                [
                  ["call", Phone],
                  ["whatsapp", MessageCircle],
                  ["email", Mail],
                ] as const
              ).map(([key, Icon]) => (
                <label
                  key={key}
                  className={cn(
                    "relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-[14px] font-medium has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                    field.value === key
                      ? "border-electric-600 bg-electric-50 text-navy-900"
                      : "border-mist-200 text-ink-900",
                  )}
                >
                  <RadioGroupItem
                    value={key}
                    className="absolute inset-0 size-full opacity-0 after:hidden"
                  />
                  <Icon aria-hidden="true" className="size-4" />
                  {t(`query.${key}`)}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </fieldset>

      <FormField id="query-notes" label={t("query.notes")} hint={t("query.notesHint")}>
        {(describedBy) => (
          <Textarea
            id="query-notes"
            rows={3}
            maxLength={1000}
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
                id="query-consent"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "query-consent-error" : undefined}
                className="mt-0.5"
              />
              <label
                htmlFor="query-consent"
                className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
              >
                {consentText}
              </label>
            </div>
            {errors.consent ? (
              <p id="query-consent-error" className="pl-8 text-[13px] text-danger-600">
                {error("consent")}
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
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <Button type="submit" size="lg" loading={sending}>
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

export { QueryStep };
