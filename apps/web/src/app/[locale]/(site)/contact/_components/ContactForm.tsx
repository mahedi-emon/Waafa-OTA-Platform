"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Lock, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { whatsappLink, type LeadCreated } from "@waafa/shared";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LeadSuccess } from "@/components/leads/LeadSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_TOPICS,
  buildContactLead,
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/leads/contactLeadForm";

type ContactFormProps = {
  countries: Array<{ code: string; name: string; dial: string }>;
  whatsappE164: string;
};

const DEFAULTS: ContactFormValues = {
  name: "",
  phoneCountry: "BD",
  phone: "",
  email: "",
  topic: "flights",
  message: "",
};

/**
 * Contact page message (Contact, Contact-sent): one step, sent to POST /api/leads as a CNT lead with one idempotency key
 * per message, then the boarding-pass success with the reference.
 */
function ContactForm({ countries, whatsappE164 }: ContactFormProps) {
  const t = useTranslations("Contact");
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { ...DEFAULTS, phoneCountry: countries[0]?.code ?? "BD" },
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const phoneCountry = useWatch({ control: form.control, name: "phoneCountry" });
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<"retry" | "rate" | null>(null);
  const [sent, setSent] = useState<{ name: string; created: LeadCreated } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const message = (key: keyof ContactFormValues) => {
    const code = errors[key]?.message;
    return code ? t(`form.errors.${code}` as "form.errors.nameRequired") : undefined;
  };

  const submit = form.handleSubmit(async (values) => {
    if (sending) return;
    setSending(true);
    setFailure(null);
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: key,
          lead: buildContactLead(values, window.location.pathname),
        }),
      });
      if (!response.ok) {
        setFailure(response.status === 429 ? "rate" : "retry");
        return;
      }
      setSent({ name: values.name.split(/\s+/)[0] ?? values.name, created: await response.json() });
      setIdempotencyKey(null);
    } catch {
      setFailure("retry");
    } finally {
      setSending(false);
    }
  });

  if (sent) {
    return (
      <LeadSuccess
        title={t("sent.title")}
        lead={t("sent.line", { name: sent.name, reference: sent.created.reference })}
        reference={sent.created.reference}
        labels={{
          reference: t("sent.reference"),
          copy: t("sent.copy"),
          copied: t("sent.copied"),
          copyFailed: t("sent.copyFailed"),
        }}
        steps={[]}
        actions={
          <>
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(
                  whatsappE164,
                  t("sent.whatsappMessage", { reference: sent.created.reference }),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                {t("sent.whatsapp")}
              </a>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                form.reset({ ...DEFAULTS, phoneCountry: countries[0]?.code ?? "BD" });
                setSent(null);
              }}
            >
              <RotateCcw aria-hidden="true" />
              {t("sent.another")}
            </Button>
          </>
        }
      />
    );
  }

  const phone = form.register("phone");

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && Object.keys(errors).length > 0 ? t("form.errors.summary") : ""}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          id="contact-name"
          label={
            <>
              {t("form.name")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("name")}
        >
          {(describedBy) => (
            <Input
              id="contact-name"
              autoComplete="name"
              placeholder={t("form.namePlaceholder")}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("name")}
            />
          )}
        </FormField>
        <FormField
          id="contact-phone"
          label={
            <>
              {t("form.phone")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("phone")}
        >
          {(describedBy) => (
            <PhoneField
              id="contact-phone"
              countries={countries}
              country={phoneCountry}
              onCountryChange={(code) => form.setValue("phoneCountry", code)}
              countryLabel={t("form.phoneCountry")}
              invalid={Boolean(errors.phone)}
              describedBy={describedBy}
              inputRef={phone.ref}
              inputProps={{
                name: phone.name,
                onChange: phone.onChange,
                onBlur: phone.onBlur,
                inputMode: "tel",
                autoComplete: "tel-national",
                placeholder: t("form.phonePlaceholder"),
              }}
            />
          )}
        </FormField>
      </div>
      <div className="flex flex-col gap-2">
        <p id="contact-topic" className="text-[14px] font-semibold text-ink-900">
          {t("form.topic")} <span aria-hidden="true">*</span>
        </p>
        <Controller
          control={form.control}
          name="topic"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="contact-topic"
              value={field.value}
              onChange={field.onChange}
              options={CONTACT_TOPICS.map((value) => ({
                value,
                label: t(`form.topics.${value}`),
              }))}
            />
          )}
        />
      </div>
      <FormField
        id="contact-message"
        label={
          <>
            {t("form.message")} <span aria-hidden="true">*</span>
          </>
        }
        error={message("message")}
      >
        {(describedBy) => (
          <Textarea
            id="contact-message"
            rows={5}
            maxLength={2000}
            placeholder={t("form.messagePlaceholder")}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("message")}
          />
        )}
      </FormField>
      <FormField
        id="contact-email"
        label={t("form.email")}
        hint={t("form.emailHint")}
        error={message("email")}
      >
        {(describedBy) => (
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("email")}
          />
        )}
      </FormField>
      {failure ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-danger-25 p-3 text-[13.5px] text-danger-600"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {failure === "rate" ? t("form.rate") : t("form.failed")}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" loading={sending}>
          {t("form.submit")}
        </Button>
        <p className="flex items-center gap-1.5 text-[13px] text-mist-600">
          <Lock aria-hidden="true" className="size-3.5 shrink-0" />
          {t("form.spam")}
        </p>
      </div>
    </form>
  );
}

export { ContactForm };
