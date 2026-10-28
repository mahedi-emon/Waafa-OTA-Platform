"use client";

import { useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ContactStepValues } from "@/lib/leads/contactForm";

type ContactStepProps = {
  defaultValues: ContactStepValues;
  emailRequired: boolean;
  countries: Array<{ code: string; name: string; dial: string }>;
  /** `keep`: the visitor's OK to be called if they don't finish (FR-FLT-08); only asked when `offerKeep`. */
  onSubmit: (values: ContactStepValues, keep: boolean) => void;
  /** Ask for the OK to keep step 1 (partial capture, issue 250). */
  offerKeep?: boolean;
  /** Module copy that replaces the travel defaults, e.g. for Waafa’s World quotes. */
  copy?: { title?: string; emailHint?: string };
};

type Field = "name" | "phone" | "email";
type Errors = Partial<Record<keyof ContactStepValues, string>>;
const ORDER: Field[] = ["name", "phone", "email"];

/**
 * Step 1 (Flights, Flights-err): how the travel expert reaches the visitor. Errors show under each field. Plain state
 * instead of react-hook-form (issue 236): this is the first step on every lead page, so the form library stays out of
 * the first load; step 2 keeps it. Same rules as before: a field is checked when it loses focus, then on every change,
 * and every field after the first submit; the first wrong field gets focus. zod and the phone rules load on the first
 * check (issue 170).
 */
function ContactStep({
  defaultValues,
  emailRequired,
  countries,
  onSubmit,
  copy,
  offerKeep = false,
}: ContactStepProps) {
  const t = useTranslations("Leads");
  const [values, setValues] = useState<ContactStepValues>(defaultValues);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [keep, setKeep] = useState(false);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  // The newest values for checks that resolve after a later keystroke; every change writes it before setValues.
  const latest = useRef(defaultValues);

  async function check(next: ContactStepValues) {
    const { contactStepSchema } = await import("@/lib/leads/contactForm");
    const result = contactStepSchema(emailRequired).safeParse(next);
    const found: Errors = {};
    if (!result.success)
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactStepValues;
        found[key] ??= issue.message;
      }
    return { found, data: result.success ? result.data : null };
  }

  /** Re-checks the given fields against the newest values and updates only their messages. */
  async function revalidate(fields: Array<keyof ContactStepValues>) {
    const { found } = await check(latest.current);
    setErrors((current) => {
      const next = { ...current };
      for (const field of fields) {
        if (found[field]) next[field] = found[field];
        else delete next[field];
      }
      return next;
    });
  }

  function change(field: keyof ContactStepValues, value: string) {
    const next = { ...latest.current, [field]: value };
    latest.current = next;
    setValues(next);
    if (submitCount > 0 || touched[field as Field]) void revalidate([field]);
  }

  function blur(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
    void revalidate([field]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
    const { found, data } = await check(latest.current);
    setErrors(found);
    if (data) {
      onSubmit(data, offerKeep && keep);
      return;
    }
    const first = ORDER.find((field) => found[field]);
    if (first) inputs.current[first]?.focus();
  }

  const error = (key: keyof ContactStepValues) => {
    const message = errors[key];
    return message ? t(`errors.${message}` as "errors.nameRequired") : undefined;
  };
  const errorCount = Object.keys(errors).length;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <h3 className="font-display text-[18px] font-bold text-navy-900">
          {copy?.title ?? t("contact.title")}
        </h3>
        <p className="text-[14px] text-mist-600">{t("contact.lead")}</p>
      </div>
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && errorCount > 0 ? t("errors.summary", { count: errorCount }) : ""}
      </p>
      <FormField
        id="lead-name"
        label={
          <>
            {t("contact.name")} <span aria-hidden="true">*</span>
          </>
        }
        error={error("name")}
      >
        {(describedBy) => (
          <Input
            ref={(node) => {
              inputs.current.name = node;
            }}
            id="lead-name"
            name="name"
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy}
            value={values.name}
            onChange={(event) => change("name", event.target.value)}
            onBlur={() => blur("name")}
          />
        )}
      </FormField>
      <FormField
        id="lead-phone"
        label={
          <>
            {t("contact.phone")} <span aria-hidden="true">*</span>
          </>
        }
        hint={t("contact.phoneHint")}
        error={error("phone")}
      >
        {(describedBy) => (
          <PhoneField
            id="lead-phone"
            countries={countries}
            country={values.phoneCountry}
            onCountryChange={(code) => {
              const next = { ...latest.current, phoneCountry: code };
              latest.current = next;
              setValues(next);
              if (submitCount > 0) void revalidate(["phoneCountry", "phone"]);
            }}
            countryLabel={t("contact.country")}
            invalid={Boolean(errors.phone)}
            describedBy={describedBy}
            inputRef={(node) => {
              inputs.current.phone = node;
            }}
            inputProps={{
              name: "phone",
              value: values.phone,
              onChange: (event) => change("phone", event.target.value),
              onBlur: () => blur("phone"),
              "aria-required": true,
            }}
          />
        )}
      </FormField>
      <FormField
        id="lead-email"
        label={
          emailRequired ? (
            <>
              {t("contact.email")} <span aria-hidden="true">*</span>
            </>
          ) : (
            t("contact.emailOptional")
          )
        }
        hint={copy?.emailHint ?? t("contact.emailHint")}
        error={error("email")}
      >
        {(describedBy) => (
          <Input
            ref={(node) => {
              inputs.current.email = node;
            }}
            id="lead-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-required={emailRequired || undefined}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy}
            value={values.email}
            onChange={(event) => change("email", event.target.value)}
            onBlur={() => blur("email")}
          />
        )}
      </FormField>
      {offerKeep ? (
        <div className="flex items-start gap-3">
          <Checkbox
            id="lead-keep"
            checked={keep}
            onCheckedChange={setKeep}
            aria-describedby="lead-keep-help"
            className="mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <label htmlFor="lead-keep" className="text-[14.5px] font-medium text-ink-900">
              {t("keep.label")}
            </label>
            <p id="lead-keep-help" className="text-[13px] text-mist-600">
              {t("keep.help")}
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-[13px] text-mist-600">
          <Lock aria-hidden="true" className="size-3.5" />
          {t("contact.private")}
        </p>
        <Button type="submit" size="lg" className="sm:min-w-44">
          {t("contact.continue")}
        </Button>
      </div>
    </form>
  );
}

export { ContactStep };
