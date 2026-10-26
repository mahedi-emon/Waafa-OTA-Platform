"use client";

import { useState } from "react";
import { lazyResolver } from "@/lib/forms/lazyResolver";
import { CircleAlert, MessageCircle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FEEDBACK_SERVICES } from "@waafa/shared/constants";
import { DrawCheck } from "@/components/motion/DrawCheck";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { ConsentField } from "@/components/forms/ConsentField";
import { DocumentSlot, type SlotFile } from "@/components/forms/DocumentSlot";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { StarRatingInput } from "@/components/forms/StarRatingInput";
import { useTurnstile } from "@/components/forms/useTurnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import type { FeedbackFormValues } from "@/lib/content/feedbackForm";
import { uploadsInFlight } from "@/lib/forms/uploadsInFlight";
import { useSubmitOnce } from "@/components/forms/useSubmitOnce";

// zod, the schema and the phone rules load on the form's first check, not with the page (issue 236).
const formResolver = lazyResolver(async () => {
  const [{ zodResolver }, { feedbackFormSchema }] = await Promise.all([
    import("@hookform/resolvers/zod"),
    import("@/lib/content/feedbackForm"),
  ]);
  return zodResolver(feedbackFormSchema);
});

type FeedbackFormProps = {
  countries: Array<{ code: string; name: string; dial: string }>;
};

const DEFAULTS: FeedbackFormValues = {
  name: "",
  phoneCountry: "BD",
  phone: "",
  service: "packages",
  reference: "",
  rating: "",
  comment: "",
  consentToPublish: false,
};

/**
 * "Travelled or shopped with us?" (Feedback, Feedback-sent): sent to POST /api/feedback with one idempotency key, stored
 * as pending; the wall shows it only after a moderator approves it and only with consent.
 */
function FeedbackForm({ countries }: FeedbackFormProps) {
  const t = useTranslations("Feedback");
  const defaults = { ...DEFAULTS, phoneCountry: countries[0]?.code ?? "BD" };
  const form = useForm<FeedbackFormValues>({
    resolver: formResolver,
    defaultValues: defaults,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const phoneCountry = useWatch({ control: form.control, name: "phoneCountry" });
  const [photo, setPhoto] = useState<SlotFile | null>(null);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<"retry" | "rate" | "uploading" | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);
  const once = useSubmitOnce();
  const turnstile = useTurnstile();

  const message = (key: keyof FeedbackFormValues) => {
    const code = errors[key]?.message;
    return code ? t(`form.errors.${code}` as "form.errors.nameRequired") : undefined;
  };

  const submit = form.handleSubmit(async (values) => {
    // A file still uploading would be left out (issue 232).
    if (uploadsInFlight()) {
      setFailure("uploading");
      return;
    }
    if (sending) return;
    setSending(true);
    setFailure(null);
    const key = once.start();
    if (!key) return;
    try {
      const image =
        photo && (photo.mimeType === "image/jpeg" || photo.mimeType === "image/png")
          ? {
              fileName: photo.fileName,
              mimeType: photo.mimeType,
              sizeBytes: photo.sizeBytes,
              ...(photo.storageKey ? { storageKey: photo.storageKey } : {}),
            }
          : null;
      const turnstileToken = await turnstile.getToken();
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: key,
          feedback: (await import("@/lib/content/feedbackForm")).buildFeedbackInput(values, image),
          turnstileToken,
        }),
      });
      turnstile.reset();
      if (!response.ok) {
        setFailure(response.status === 429 ? "rate" : "retry");
        return;
      }
      const body = (await response.json()) as { firstName: string };
      setSentName(body.firstName);
      once.renew();
    } catch {
      setFailure("retry");
    } finally {
      once.finished();
      setSending(false);
    }
  });

  if (sentName) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <DrawCheck size={56} />
        <h3 className="font-display text-[22px] font-extrabold text-navy-900">
          {t("sent.title", { name: sentName })}
        </h3>
        <p className="max-w-[52ch] text-[15px] text-mist-700">{t("sent.body")}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/contact">
              <MessageCircle aria-hidden="true" />
              {t("sent.talk")}
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset(defaults);
              setPhoto(null);
              setSentName(null);
            }}
          >
            <RotateCcw aria-hidden="true" />
            {t("sent.another")}
          </Button>
        </div>
      </div>
    );
  }

  const phone = form.register("phone");

  return (
    <form
      noValidate
      onSubmit={submit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          id="fb-name"
          label={
            <>
              {t("form.name")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("name")}
        >
          {(describedBy) => (
            <Input
              id="fb-name"
              autoComplete="given-name"
              placeholder={t("form.namePlaceholder")}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("name")}
            />
          )}
        </FormField>
        <FormField
          id="fb-phone"
          label={
            <>
              {t("form.phone")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("phone")}
        >
          {(describedBy) => (
            <PhoneField
              id="fb-phone"
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
        <p id="fb-service" className="text-[14px] font-semibold text-ink-900">
          {t("form.service")} <span aria-hidden="true">*</span>
        </p>
        <Controller
          control={form.control}
          name="service"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="fb-service"
              value={field.value}
              onChange={field.onChange}
              options={FEEDBACK_SERVICES.map((value) => ({
                value,
                label: t(`services.${value}`),
              }))}
            />
          )}
        />
      </div>

      <FormField
        id="fb-reference"
        label={
          <>
            {t("form.reference")}{" "}
            <span className="font-normal text-mist-600">{t("form.optional")}</span>
          </>
        }
        error={message("reference")}
      >
        {(describedBy) => (
          <Input
            id="fb-reference"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder={t("form.referencePlaceholder")}
            aria-invalid={errors.reference ? true : undefined}
            aria-describedby={describedBy}
            className="uppercase"
            {...form.register("reference")}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-1.5">
        <p id="fb-rating" className="text-[14px] font-semibold text-ink-900">
          {t("form.rating")} <span className="font-normal text-mist-600">{t("form.optional")}</span>
        </p>
        <Controller
          control={form.control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput
              labelledBy="fb-rating"
              value={field.value}
              onChange={field.onChange}
              starLabels={[1, 2, 3, 4, 5].map((count) => t("form.stars", { count }))}
              clearLabel={t("form.clearRating")}
            />
          )}
        />
      </div>

      <FormField
        id="fb-comment"
        label={
          <>
            {t("form.comment")} <span aria-hidden="true">*</span>
          </>
        }
        error={message("comment")}
      >
        {(describedBy) => (
          <Textarea
            id="fb-comment"
            rows={5}
            maxLength={1000}
            aria-invalid={errors.comment ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("comment")}
          />
        )}
      </FormField>

      <DocumentSlot
        title={t("form.photo")}
        kind={"photo"}
        sub={t("form.photoSub")}
        file={photo}
        onChange={setPhoto}
        imagesOnly
        labels={{
          choose: t("form.photoChoose"),
          replace: t("form.photoReplace"),
          rule: t("form.photoHint"),
          remove: t("form.photoRemove", { file: "{file}" }),
          added: t("form.photoAdded"),
          uploading: t("form.photoUploading"),
          errors: {
            fileType: t("form.photoBad"),
            fileSize: t("form.photoBad"),
            fileEmpty: t("form.photoBad"),
            upload: t("form.photoUploadFailed"),
          },
        }}
      />

      <Controller
        control={form.control}
        name="consentToPublish"
        render={({ field }) => (
          <ConsentField
            id="fb-consent"
            text={t("form.consent")}
            checked={field.value}
            onChange={field.onChange}
            inputRef={field.ref}
          />
        )}
      />

      {failure ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-danger-25 p-3 text-[13.5px] text-danger-600"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {failure === "uploading"
            ? t("form.waitUpload")
            : failure === "rate"
              ? t("form.rate")
              : t("form.failed")}
        </p>
      ) : null}
      {turnstile.field}
      <Button type="submit" size="lg" loading={sending} className="self-start">
        {t("form.submit")}
      </Button>
    </form>
  );
}

export { FeedbackForm };
