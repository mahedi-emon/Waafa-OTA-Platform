"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactStepSchema, type ContactStepValues } from "@/lib/leads/contactForm";

type ContactStepProps = {
  defaultValues: ContactStepValues;
  emailRequired: boolean;
  countries: Array<{ code: string; name: string; dial: string }>;
  onSubmit: (values: ContactStepValues) => void;
};

/** Step 1 (Flights, Flights-err): how the travel expert reaches the visitor. Errors show under each field. */
function ContactStep({ defaultValues, emailRequired, countries, onSubmit }: ContactStepProps) {
  const t = useTranslations("Leads");
  const schema = useMemo(() => contactStepSchema(emailRequired), [emailRequired]);
  const form = useForm<ContactStepValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const error = (key: keyof ContactStepValues) => {
    const message = errors[key]?.message;
    return message ? t(`errors.${message}` as "errors.nameRequired") : undefined;
  };
  const errorCount = Object.keys(errors).length;
  const phone = form.register("phone");
  const phoneCountry = useWatch({ control: form.control, name: "phoneCountry" });

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <h3 className="font-display text-[18px] font-bold text-navy-900">{t("contact.title")}</h3>
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
            id="lead-name"
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("name")}
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
            country={phoneCountry}
            onCountryChange={(code) =>
              form.setValue("phoneCountry", code, { shouldValidate: submitCount > 0 })
            }
            countryLabel={t("contact.country")}
            invalid={Boolean(errors.phone)}
            describedBy={describedBy}
            inputRef={phone.ref}
            inputProps={{
              name: phone.name,
              onChange: phone.onChange,
              onBlur: phone.onBlur,
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
        hint={t("contact.emailHint")}
        error={error("email")}
      >
        {(describedBy) => (
          <Input
            id="lead-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-required={emailRequired || undefined}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("email")}
          />
        )}
      </FormField>
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
