"use client";

import { useId, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Compass,
  Heart,
  Landmark,
  Mail,
  MessageCircle,
  Mountain,
  Phone,
  Route,
  ShoppingBag,
  Sun,
  User,
  Users,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { ChoiceChip } from "@/components/forms/ChoiceChip";
import { FormField } from "@/components/forms/FormField";
import { NumberStepper } from "@/components/forms/NumberStepper";
import { useDhakaToday } from "@/components/search/useDhakaToday";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGET_BANDS,
  HOTEL_CLASSES,
  INTERESTS,
  TRIP_FOR,
  planTripSchema,
  type PlanTripInput,
  type PlanTripValues,
} from "@/lib/leads/planTripLeadForm";
import { addMonths, formatShortMonth } from "@/lib/search/isoDate";

const INTEREST_ICONS: Record<(typeof INTERESTS)[number], LucideIcon> = {
  beach: Waves,
  mountains: Mountain,
  city: Building2,
  food: UtensilsCrossed,
  shopping: ShoppingBag,
  culture: Landmark,
  adventure: Compass,
  relaxed: Sun,
};
const TRIP_FOR_ICONS: Record<(typeof TRIP_FOR)[number], LucideIcon> = {
  family: Users,
  couple: Heart,
  friends: Route,
  solo: User,
  office: Briefcase,
};
const MONTHS_AHEAD = 6;

type PlanStepProps = {
  defaultValues: PlanTripInput;
  places: { domestic: string[]; abroad: string[] };
  consentText: string;
  sending: boolean;
  onBack: (values: PlanTripInput) => void;
  onSubmit: (values: PlanTripValues) => void;
};

/** One question group: a legend-like heading, a lead line and its controls. */
function Question({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
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
        {lead ? <p className="text-[14px] text-mist-600">{lead}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Plan my trip step 2 (PlanTrip boards): where, when, who, budget and style, then how to send the plan. */
function PlanStep({
  defaultValues,
  places,
  consentText,
  sending,
  onBack,
  onSubmit,
}: PlanStepProps) {
  const t = useTranslations("PlanTrip");
  const tLeads = useTranslations("Leads");
  const id = useId();
  const today = useDhakaToday();
  const [draftPlace, setDraftPlace] = useState("");
  const form = useForm<PlanTripInput, unknown, PlanTripValues>({
    resolver: zodResolver(planTripSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const [chosen, notSure, dateMode, startDate, adults] = useWatch({
    control: form.control,
    name: ["places", "notSure", "dateMode", "startDate", "adults"],
  });
  const errorCount = Object.keys(errors).length;
  const message = (key: keyof PlanTripInput) => {
    const code = errors[key]?.message;
    if (!code) return undefined;
    return t.has(`errors.${code}` as "errors.placesRequired")
      ? t(`errors.${code}` as "errors.placesRequired")
      : tLeads(`errors.${code}` as "errors.consentRequired");
  };
  const custom = chosen.filter(
    (place) => !places.domestic.includes(place) && !places.abroad.includes(place),
  );

  function togglePlace(place: string, on: boolean) {
    const next = on ? [...chosen, place].slice(0, 6) : chosen.filter((item) => item !== place);
    form.setValue("places", next, { shouldValidate: submitCount > 0 });
    if (on) form.setValue("notSure", false);
  }
  function addDraftPlace() {
    const place = draftPlace.trim().slice(0, 60);
    if (place && !chosen.includes(place)) togglePlace(place, true);
    setDraftPlace("");
  }
  const stepper = (
    name: "adults" | "children" | "infants" | "nights",
    min: number,
    max: number,
    sub: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <NumberStepper
          label={t(name)}
          sub={sub}
          value={field.value}
          min={min}
          max={max}
          onChange={field.onChange}
          labels={{
            decrease: t("decrease", { label: t(name) }),
            increase: t("increase", { label: t(name) }),
          }}
        />
      )}
    />
  );
  const months = today
    ? Array.from({ length: MONTHS_AHEAD }, (_, index) => addMonths(today, index))
    : [];

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h3 className="font-display text-[18px] font-bold text-navy-900">{t("stepTitle")}</h3>
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && errorCount > 0 ? tLeads("errors.summary", { count: errorCount }) : ""}
      </p>

      <Question id={`${id}-where`} title={t("places")} lead={t("placesLead")}>
        {(
          [
            ["domestic", places.domestic],
            ["abroad", places.abroad],
          ] as const
        ).map(([group, list]) =>
          list.length > 0 ? (
            <div key={group} className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold tracking-wide text-mist-600 uppercase">
                {t(group)}
              </p>
              <div className="flex flex-wrap gap-2">
                {list.map((place) => (
                  <ChoiceChip
                    key={place}
                    label={place}
                    pressed={chosen.includes(place)}
                    onPressedChange={(on) => togglePlace(place, on)}
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold tracking-wide text-mist-600 uppercase">
            {t("somethingElse")}
          </p>
          <div className="flex flex-wrap gap-2">
            {custom.map((place) => (
              <ChoiceChip
                key={place}
                label={place}
                pressed
                onPressedChange={() => togglePlace(place, false)}
              />
            ))}
            <ChoiceChip
              label={t("notSure")}
              pressed={notSure}
              onPressedChange={(on) => {
                form.setValue("notSure", on);
                if (on) form.setValue("places", []);
                if (submitCount > 0) void form.trigger("places");
              }}
            />
          </div>
          <div className="flex gap-2">
            <Input
              aria-label={t("addPlace")}
              placeholder={t("addPlacePlaceholder")}
              value={draftPlace}
              maxLength={60}
              onChange={(event) => setDraftPlace(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addDraftPlace();
                }
              }}
              className="h-12 rounded-xl"
            />
            <Button type="button" variant="secondary" onClick={addDraftPlace}>
              {t("add")}
            </Button>
          </div>
        </div>
        {errors.places ? (
          <p role="alert" className="text-[13px] text-danger-600">
            {message("places")}
          </p>
        ) : null}
      </Question>

      <Question id={`${id}-when`} title={t("when")} lead={t("whenLead")}>
        <Controller
          control={form.control}
          name="dateMode"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy={`${id}-when`}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "month", label: t("flexible") },
                { value: "exact", label: t("exact") },
              ]}
            />
          )}
        />
        {dateMode === "month" ? (
          <>
            <p id={`${id}-month`} className="text-[14px] font-semibold text-ink-900">
              {t("whichMonth")}
            </p>
            <Controller
              control={form.control}
              name="month"
              render={({ field }) => (
                <ChipRadioGroup
                  labelledBy={`${id}-month`}
                  value={field.value}
                  onChange={field.onChange}
                  options={months.map((month) => ({
                    value: month.slice(0, 7),
                    label: formatShortMonth(month),
                  }))}
                />
              )}
            />
            {errors.month ? (
              <p className="text-[13px] text-danger-600">{message("month")}</p>
            ) : null}
            <div className="rounded-xl border border-mist-200 px-4">
              {stepper("nights", 1, 60, t("nightsSub"))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id="plan-start" label={t("leave")} error={message("startDate")}>
              {(describedBy) => (
                <Input
                  id="plan-start"
                  type="date"
                  min={today ?? undefined}
                  aria-invalid={errors.startDate ? true : undefined}
                  aria-describedby={describedBy}
                  className="h-12 rounded-xl"
                  {...form.register("startDate")}
                />
              )}
            </FormField>
            <FormField id="plan-end" label={t("back")} error={message("endDate")}>
              {(describedBy) => (
                <Input
                  id="plan-end"
                  type="date"
                  min={startDate || today || undefined}
                  aria-invalid={errors.endDate ? true : undefined}
                  aria-describedby={describedBy}
                  className="h-12 rounded-xl"
                  {...form.register("endDate")}
                />
              )}
            </FormField>
          </div>
        )}
      </Question>

      <Question id={`${id}-who`} title={t("who")} lead={t("whoLead")}>
        <div className="divide-y divide-mist-200 rounded-xl border border-mist-200 px-4">
          {stepper("adults", 1, 40, t("adultsSub"))}
          {stepper("children", 0, 20, t("childrenSub"))}
          {stepper("infants", 0, Math.max(adults, 1), t("infantsSub"))}
        </div>
        {errors.infants ? (
          <p className="text-[13px] text-danger-600">{message("infants")}</p>
        ) : null}
        <p id={`${id}-for`} className="text-[14px] font-semibold text-ink-900">
          {t("tripFor")}
        </p>
        <Controller
          control={form.control}
          name="tripFor"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy={`${id}-for`}
              value={field.value}
              onChange={field.onChange}
              options={TRIP_FOR.map((value) => ({
                value,
                label: t(`tripForOptions.${value}`),
                icon: TRIP_FOR_ICONS[value],
              }))}
            />
          )}
        />
      </Question>

      <Question id={`${id}-budget`} title={t("budget")} lead={t("budgetLead")}>
        <p id={`${id}-band`} className="text-[14px] font-semibold text-ink-900">
          {t("budgetLabel")}
        </p>
        <Controller
          control={form.control}
          name="budgetBand"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy={`${id}-band`}
              value={field.value}
              onChange={field.onChange}
              options={[...BUDGET_BANDS.slice(1), BUDGET_BANDS[0]].map((value) => ({
                value,
                label: t(`budgets.${value}`),
              }))}
            />
          )}
        />
        <p id={`${id}-hotels`} className="text-[14px] font-semibold text-ink-900">
          {t("hotelClass")}
        </p>
        <Controller
          control={form.control}
          name="hotelClass"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy={`${id}-hotels`}
              value={field.value}
              onChange={field.onChange}
              options={HOTEL_CLASSES.map((value) => ({ value, label: t(`hotelClasses.${value}`) }))}
            />
          )}
        />
        <p className="text-[14px] font-semibold text-ink-900">{t("interests")}</p>
        <Controller
          control={form.control}
          name="interests"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <ChoiceChip
                  key={interest}
                  label={t(`interestOptions.${interest}`)}
                  icon={INTEREST_ICONS[interest]}
                  pressed={field.value.includes(interest)}
                  onPressedChange={(on) =>
                    field.onChange(
                      on
                        ? [...field.value, interest]
                        : field.value.filter((item) => item !== interest),
                    )
                  }
                />
              ))}
            </div>
          )}
        />
        {(
          [
            ["includeFlights", "flights", "flightsSub"],
            ["visaHelp", "visa", "visaSub"],
          ] as const
        ).map(([name, label, sub]) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-mist-200 px-4 py-3">
                <span>
                  <span className="block text-[15px] font-semibold text-navy-900">{t(label)}</span>
                  <span className="block text-[13px] text-mist-600">{t(sub)}</span>
                </span>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />
        ))}
      </Question>

      <Question id={`${id}-contact`} title={t("contactBy")}>
        <Controller
          control={form.control}
          name="preferredContact"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy={`${id}-contact`}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "call", label: t("call"), icon: Phone },
                { value: "whatsapp", label: t("whatsapp"), icon: MessageCircle },
                { value: "email", label: t("email"), icon: Mail },
              ]}
            />
          )}
        />
        <FormField id="plan-notes" label={t("notes")}>
          {(describedBy) => (
            <Textarea
              id="plan-notes"
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
                  id="plan-consent"
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "plan-consent-error" : undefined}
                  className="mt-0.5"
                />
                <label
                  htmlFor="plan-consent"
                  className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
                >
                  {consentText}
                </label>
              </div>
              {errors.consent ? (
                <p id="plan-consent-error" className="pl-8 text-[13px] text-danger-600">
                  {message("consent")}
                </p>
              ) : null}
            </div>
          )}
        />
      </Question>

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

export { PlanStep };
