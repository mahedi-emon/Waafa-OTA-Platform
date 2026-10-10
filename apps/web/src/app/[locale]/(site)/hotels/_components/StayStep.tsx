"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { cn } from "cn";
import { HotelBudgetBandSchema, HotelMealsSchema } from "@waafa/shared";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { stayStepSchema, type StayStepInput, type StayStepValues } from "@/lib/leads/hotelLeadForm";

type StayStepProps = {
  defaultValues: StayStepInput;
  nationalities: Array<{ code: string; name: string }>;
  consentText: string;
  today: string;
  sending: boolean;
  onBack: (values: StayStepInput) => void;
  onSubmit: (values: StayStepValues) => void;
};

/** Hotel request step 2 (Hotels-2): the stay from the search, budget, meals, how to contact, notes and consent. */
function StayStep({
  defaultValues,
  nationalities,
  consentText,
  today,
  sending,
  onBack,
  onSubmit,
}: StayStepProps) {
  const t = useTranslations("Hotels");
  const tLeads = useTranslations("Leads");
  const id = useId();
  const form = useForm<StayStepInput, unknown, StayStepValues>({
    resolver: zodResolver(stayStepSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const checkin = useWatch({ control: form.control, name: "checkin" });
  const error = (key: keyof StayStepInput) => {
    const message = errors[key]?.message;
    if (!message) return undefined;
    return t.has(`errors.${message}` as "errors.placeRequired")
      ? t(`errors.${message}` as "errors.placeRequired")
      : tLeads(`errors.${message}` as "errors.consentRequired");
  };
  const errorCount = Object.keys(errors).length;

  const choice = (
    name: "nationality" | "budgetBand" | "meals",
    label: string,
    options: Array<{ value: string; label: string }>,
  ) => (
    <FormField id={`stay-${name}`} label={label}>
      {() => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={`stay-${name}`} ref={field.ref} className="h-12 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </FormField>
  );

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <h3 className="font-display text-[18px] font-bold text-navy-900">{t("stay.title")}</h3>
        <p className="text-[14px] text-mist-600">{t("stay.lead")}</p>
      </div>
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && errorCount > 0 ? tLeads("errors.summary", { count: errorCount }) : ""}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="stay-place" label={t("stay.place")} error={error("place")}>
          {(describedBy) => (
            <Input
              id="stay-place"
              autoComplete="off"
              aria-invalid={errors.place ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("place")}
            />
          )}
        </FormField>
        {choice(
          "nationality",
          t("stay.nationality"),
          nationalities.map((n) => ({ value: n.code, label: n.name })),
        )}
        <FormField id="stay-checkin" label={t("stay.checkin")} error={error("checkin")}>
          {(describedBy) => (
            <Input
              id="stay-checkin"
              type="date"
              min={today || undefined}
              aria-invalid={errors.checkin ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("checkin")}
            />
          )}
        </FormField>
        <FormField id="stay-checkout" label={t("stay.checkout")} error={error("checkout")}>
          {(describedBy) => (
            <Input
              id="stay-checkout"
              type="date"
              min={checkin || today || undefined}
              aria-invalid={errors.checkout ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("checkout")}
            />
          )}
        </FormField>
        {choice(
          "budgetBand",
          t("stay.budget"),
          HotelBudgetBandSchema.options.map((band) => ({
            value: band,
            label: t(`stay.budgets.${band}`),
          })),
        )}
        {choice(
          "meals",
          t("stay.meals"),
          HotelMealsSchema.options.map((meal) => ({
            value: meal,
            label: t(`stay.mealOptions.${meal}`),
          })),
        )}
      </div>

      <fieldset>
        <legend id={`${id}-contact`} className="mb-2 text-[14px] font-semibold text-ink-900">
          {t("stay.contactBy")}
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
                    "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-[14px] font-medium",
                    field.value === key
                      ? "border-electric-600 bg-electric-50 text-navy-900"
                      : "border-mist-200 text-ink-900",
                  )}
                >
                  <RadioGroupItem value={key} className="sr-only" />
                  <Icon aria-hidden="true" className="size-4" />
                  {t(`stay.${key}`)}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </fieldset>

      <FormField id="stay-notes" label={t("stay.notes")} hint={t("stay.notesHint")}>
        {(describedBy) => (
          <Textarea
            id="stay-notes"
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
                id="stay-consent"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "stay-consent-error" : undefined}
                className="mt-0.5"
              />
              <label
                htmlFor="stay-consent"
                className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
              >
                {consentText}
              </label>
            </div>
            {errors.consent ? (
              <p id="stay-consent-error" className="pl-8 text-[13px] text-danger-600">
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

export { StayStep };
