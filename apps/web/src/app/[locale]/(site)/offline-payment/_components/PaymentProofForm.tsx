"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { DrawCheck } from "@/components/motion/DrawCheck";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";
import { DocumentSlot, type SlotFile } from "@/components/forms/DocumentSlot";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildPaymentProof,
  hasTransactionOrSlip,
  paymentProofFormSchema,
  type PaymentProofFormValues,
} from "@/lib/leads/paymentProofForm";

type PaymentProofFormProps = {
  accounts: Array<{ id: string; title: string }>;
  countries: Array<{ code: string; name: string; dial: string }>;
};

/**
 * "Send us the proof" (OfflinePay, OfflinePay-sent): one step to POST /api/payment-proof with one idempotency key.
 * Phase A keeps the slip in the browser; its name, type and size go with the proof (D87).
 */
function PaymentProofForm({ accounts, countries }: PaymentProofFormProps) {
  const t = useTranslations("OfflinePay");
  const defaults: PaymentProofFormValues = {
    reference: "",
    name: "",
    phoneCountry: countries[0]?.code ?? "BD",
    phone: "",
    amount: "",
    accountId: accounts[0]?.id ?? "",
    transactionId: "",
  };
  const form = useForm<PaymentProofFormValues>({
    resolver: zodResolver(paymentProofFormSchema),
    defaultValues: defaults,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const phoneCountry = useWatch({ control: form.control, name: "phoneCountry" });
  const [slip, setSlip] = useState<SlotFile | null>(null);
  const [missingProof, setMissingProof] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<"retry" | "rate" | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const message = (key: keyof PaymentProofFormValues) => {
    const code = errors[key]?.message;
    return code ? t(`proof.errors.${code}` as "proof.errors.nameRequired") : undefined;
  };

  const submit = form.handleSubmit(async (values) => {
    if (sending) return;
    if (!hasTransactionOrSlip(values, slip)) {
      setMissingProof(true);
      return;
    }
    setMissingProof(false);
    setSending(true);
    setFailure(null);
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: key, proof: buildPaymentProof(values, slip) }),
      });
      if (!response.ok) {
        setFailure(response.status === 429 ? "rate" : "retry");
        return;
      }
      const body = (await response.json()) as { reference: string };
      setSent(body.reference);
      setIdempotencyKey(null);
    } catch {
      setFailure("retry");
    } finally {
      setSending(false);
    }
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <DrawCheck size={56} />
        <h3 className="font-display text-[22px] font-extrabold text-navy-900">
          {t("sent.title", { reference: sent })}
        </h3>
        <p className="max-w-[52ch] text-[15px] text-mist-700">{t("sent.body")}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            form.reset(defaults);
            setSlip(null);
            setSent(null);
          }}
        >
          <RotateCcw aria-hidden="true" />
          {t("sent.another")}
        </Button>
      </div>
    );
  }

  const phone = form.register("phone");

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          id="proof-reference"
          label={
            <>
              {t("proof.reference")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("reference")}
        >
          {(describedBy) => (
            <Input
              id="proof-reference"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder={t("proof.referencePlaceholder")}
              aria-invalid={errors.reference ? true : undefined}
              aria-describedby={describedBy}
              className="uppercase"
              {...form.register("reference")}
            />
          )}
        </FormField>
        <FormField
          id="proof-amount"
          label={
            <>
              {t("proof.amount")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("amount")}
        >
          {(describedBy) => (
            <Input
              id="proof-amount"
              inputMode="numeric"
              placeholder={t("proof.amountPlaceholder")}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("amount")}
            />
          )}
        </FormField>
        <FormField
          id="proof-name"
          label={
            <>
              {t("proof.name")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("name")}
        >
          {(describedBy) => (
            <Input
              id="proof-name"
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
              {...form.register("name")}
            />
          )}
        </FormField>
        <FormField
          id="proof-phone"
          label={
            <>
              {t("proof.phone")} <span aria-hidden="true">*</span>
            </>
          }
          error={message("phone")}
        >
          {(describedBy) => (
            <PhoneField
              id="proof-phone"
              countries={countries}
              country={phoneCountry}
              onCountryChange={(code) => form.setValue("phoneCountry", code)}
              countryLabel={t("proof.phoneCountry")}
              invalid={Boolean(errors.phone)}
              describedBy={describedBy}
              inputRef={phone.ref}
              inputProps={{
                name: phone.name,
                onChange: phone.onChange,
                onBlur: phone.onBlur,
                inputMode: "tel",
                autoComplete: "tel-national",
                placeholder: t("proof.phonePlaceholder"),
              }}
            />
          )}
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <p id="proof-account" className="text-[14px] font-semibold text-ink-900">
          {t("proof.paidWith")} <span aria-hidden="true">*</span>
        </p>
        <Controller
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <ChipRadioGroup
              labelledBy="proof-account"
              value={field.value}
              onChange={field.onChange}
              options={accounts.map((account) => ({ value: account.id, label: account.title }))}
            />
          )}
        />
        {message("accountId") ? (
          <p role="alert" className="text-[13px] text-danger-600">
            {message("accountId")}
          </p>
        ) : null}
      </div>

      <FormField
        id="proof-trx"
        label={t("proof.transaction")}
        hint={t("proof.transactionHint")}
        error={missingProof ? t("proof.errors.transactionOrSlip") : undefined}
      >
        {(describedBy) => (
          <Input
            id="proof-trx"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={t("proof.transactionPlaceholder")}
            aria-invalid={missingProof ? true : undefined}
            aria-describedby={describedBy}
            {...form.register("transactionId")}
          />
        )}
      </FormField>

      <DocumentSlot
        title={t("proof.slip")}
        sub={t("proof.slipSub")}
        file={slip}
        onChange={(file) => {
          setSlip(file);
          if (file) setMissingProof(false);
        }}
        labels={{
          choose: t("proof.slipChoose"),
          replace: t("proof.slipReplace"),
          rule: t("proof.slipHint"),
          remove: t("proof.slipRemove", { file: "{file}" }),
          added: t("proof.slipAdded"),
          errors: {
            fileType: t("proof.slipBad"),
            fileSize: t("proof.slipBad"),
            fileEmpty: t("proof.slipBad"),
          },
        }}
      />

      {failure ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-danger-25 p-3 text-[13.5px] text-danger-600"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {failure === "rate" ? t("proof.rate") : t("proof.failed")}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {submitCount > 0 && Object.keys(errors).length > 0 ? t("proof.errors.summary") : ""}
      </p>
      <Button type="submit" size="lg" loading={sending} className="self-start">
        {t("proof.submit")}
      </Button>
    </form>
  );
}

export { PaymentProofForm };
