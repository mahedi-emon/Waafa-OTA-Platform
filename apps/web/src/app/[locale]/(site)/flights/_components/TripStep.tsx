"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { cn } from "cn";
import { CabinClassSchema, MAX_TRAVELLERS } from "@waafa/shared";
import { FormField } from "@/components/forms/FormField";
import { TravellersFields } from "@/components/forms/TravellersFields";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  tripStepSchema,
  type TripStepInput,
  type TripStepValues,
} from "@/lib/leads/flightLeadForm";

type TripStepProps = {
  defaultValues: TripStepInput;
  airports: Array<{ iata: string; city: string }>;
  airlines: Array<{ code: string; name: string }>;
  consentText: string;
  /** Group fares have a fixed date. */
  fixedDate: boolean;
  today: string;
  sending: boolean;
  onBack: (values: TripStepInput) => void;
  onSubmit: (values: TripStepValues) => void;
};

const ANY = "any";
const BEST_TIMES = ["any", "morning", "midday", "afternoon"] as const;

/** Step 2 (Flights-2): the trip prefilled from the URL, how to contact, notes and consent. */
function TripStep({
  defaultValues,
  airports,
  airlines,
  consentText,
  fixedDate,
  today,
  sending,
  onBack,
  onSubmit,
}: TripStepProps) {
  const t = useTranslations("Flights");
  const tLeads = useTranslations("Leads");
  const id = useId();
  const form = useForm<TripStepInput, unknown, TripStepValues>({
    resolver: zodResolver(tripStepSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const depart = useWatch({ control: form.control, name: "depart" });
  const error = (key: keyof TripStepInput) => {
    const message = errors[key]?.message;
    if (!message) return undefined;
    return t.has(`errors.${message}` as "errors.fromRequired")
      ? t(`errors.${message}` as "errors.fromRequired")
      : tLeads(`errors.${message}` as "errors.consentRequired");
  };
  const errorCount = Object.keys(errors).length;

  const airportSelect = (name: "from" | "to") => (
    <FormField id={`trip-${name}`} label={t(`trip.${name}`)} error={error(name)}>
      {(describedBy) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger
                id={`trip-${name}`}
                ref={field.ref}
                aria-invalid={errors[name] ? true : undefined}
                aria-describedby={describedBy}
                className="h-12 w-full rounded-xl"
              >
                <SelectValue placeholder={t("trip.chooseAirport")} />
              </SelectTrigger>
              <SelectContent>
                {airports.map((airport) => (
                  <SelectItem key={airport.iata} value={airport.iata}>
                    {airport.city}{" "}
                    <span className="font-semibold text-mist-600">{airport.iata}</span>
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
        <h3 className="font-display text-[18px] font-bold text-navy-900">{t("trip.title")}</h3>
        <p className="text-[14px] text-mist-600">{t("trip.lead")}</p>
      </div>
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && errorCount > 0 ? tLeads("errors.summary", { count: errorCount }) : ""}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {airportSelect("from")}
        {airportSelect("to")}
        <FormField
          id="trip-depart"
          label={t("trip.departure")}
          hint={fixedDate ? t("trip.fixedDate") : undefined}
          error={error("depart")}
        >
          {(describedBy) => (
            <Input
              id="trip-depart"
              type="date"
              min={today || undefined}
              readOnly={fixedDate}
              aria-invalid={errors.depart ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("depart")}
            />
          )}
        </FormField>
        <FormField id="trip-return" label={t("trip.return")} error={error("return")}>
          {(describedBy) => (
            <Input
              id="trip-return"
              type="date"
              min={depart || today || undefined}
              aria-invalid={errors.return ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("return")}
            />
          )}
        </FormField>
        <FormField id="trip-cabin" label={t("trip.cabin")}>
          {() => (
            <Controller
              control={form.control}
              name="cabin"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="trip-cabin" ref={field.ref} className="h-12 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CabinClassSchema.options.map((cabin) => (
                      <SelectItem key={cabin} value={cabin}>
                        {t(`cabins.${cabin}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <FormField id="trip-airline" label={t("trip.airline")}>
          {() => (
            <Controller
              control={form.control}
              name="airline"
              render={({ field }) => (
                <Select
                  value={field.value || ANY}
                  onValueChange={(v) => field.onChange(v === ANY ? "" : v)}
                >
                  <SelectTrigger
                    id="trip-airline"
                    ref={field.ref}
                    className="h-12 w-full rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("trip.anyAirline")}</SelectItem>
                    {airlines.map((airline) => (
                      <SelectItem key={airline.code} value={airline.code}>
                        {airline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </div>

      <Controller
        control={form.control}
        name="travellers"
        render={({ field }) => (
          <TravellersFields
            value={field.value}
            onChange={field.onChange}
            max={MAX_TRAVELLERS}
            error={error("travellers")}
            labels={{
              legend: t("trip.travellers"),
              adults: t("trip.adults"),
              adultsSub: t("trip.adultsSub"),
              children: t("trip.children"),
              childrenSub: t("trip.childrenSub"),
              infants: t("trip.infants"),
              infantsSub: t("trip.infantsSub"),
              childAge: t("trip.childAge", { n: "{n}" }),
              years: t("trip.years", { age: "{age}" }),
              decrease: t("trip.fewer", { who: "{who}" }),
              increase: t("trip.more", { who: "{who}" }),
            }}
          />
        )}
      />

      <Controller
        control={form.control}
        name="flex"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-mist-200 px-4 py-3">
            <span>
              <span className="block text-[14.5px] font-semibold text-navy-900">
                {t("trip.flex")}
              </span>
              <span className="block text-[13px] text-mist-600">{t("trip.flexSub")}</span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />

      <fieldset>
        <legend id={`${id}-contact`} className="mb-2 text-[14px] font-semibold text-ink-900">
          {t("trip.contactBy")}
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
                  {t(`trip.${key}`)}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </fieldset>

      <FormField id="trip-best" label={t("trip.bestTime")}>
        {() => (
          <Controller
            control={form.control}
            name="bestTime"
            render={({ field }) => (
              <Select
                value={field.value || "any"}
                onValueChange={(v) => field.onChange(v === "any" ? "" : v)}
              >
                <SelectTrigger id="trip-best" ref={field.ref} className="h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BEST_TIMES.map((time) => (
                    <SelectItem
                      key={time}
                      value={time === "any" ? "any" : t(`trip.bestTimes.${time}`)}
                    >
                      {t(`trip.bestTimes.${time}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </FormField>

      <FormField id="trip-notes" label={t("trip.notes")} hint={t("trip.notesHint")}>
        {(describedBy) => (
          <Textarea
            id="trip-notes"
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
                id="trip-consent"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "trip-consent-error" : undefined}
                className="mt-0.5"
              />
              <label
                htmlFor="trip-consent"
                className="cursor-pointer text-[14px] leading-relaxed text-ink-900"
              >
                {consentText}
              </label>
            </div>
            {errors.consent ? (
              <p id="trip-consent-error" className="pl-8 text-[13px] text-danger-600">
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

export { TripStep };
