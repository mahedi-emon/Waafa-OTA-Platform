"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Store, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zoneForArea, formatTaka, type DeliveryChoice, type ShippingSettings } from "@waafa/shared";
import type { SlotFile } from "@/components/forms/DocumentSlot";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { RadioCard } from "@/components/forms/RadioCard";
import { CheckoutSummary } from "@/components/shop/CheckoutSummary";
import { OrderDone } from "@/components/shop/OrderDone";
import { PaymentOptions, type OfflineAccount } from "@/components/shop/PaymentOptions";
import { useCart } from "@/components/shop/useCart";
import { useCartPrefs } from "@/components/shop/useCartPrefs";
import { useQuote } from "@/components/shop/useQuote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import {
  COD,
  DIVISIONS,
  buildOrderInput,
  checkoutSchema,
  type CheckoutValues,
} from "@/lib/shop/checkoutForm";
import { useHydrated } from "@/lib/useHydrated";

type CheckoutFormProps = {
  countries: Array<{ code: string; name: string; dial: string }>;
  shipping: ShippingSettings;
  codLimit: number;
  accounts: OfflineAccount[];
  phoneDisplay: string;
  whatsappE164: string;
};

type Placed = {
  reference: string;
  total: number;
  email?: string;
  pickup: boolean;
  estimate: string;
  account: OfflineAccount | null;
  transactionId?: string;
  phoneDisplay: string;
};

type Failure = "retry" | "rate" | "changed" | "cod" | "minimum" | null;

const DEFAULTS: CheckoutValues = {
  name: "",
  phoneCountry: "BD",
  phone: "",
  email: "",
  vat: false,
  company: "",
  bin: "",
  deliveryMode: "courier",
  division: "",
  district: "",
  area: "",
  street: "",
  note: "",
  payment: COD,
  transactionId: "",
};

function Section({
  n,
  title,
  id,
  children,
}: {
  n: number;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-4 md:p-5"
    >
      <h2
        id={id}
        className="flex items-center gap-3 font-display text-[18px] font-extrabold text-navy-900"
      >
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-navy-900 text-[13px] text-white"
        >
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * One-page checkout (ShopCheckout): contact, delivery address or office pick-up, delivery, payment (cash on delivery
 * up to the admin limit, or a transfer with its transaction ID and optional proof) and an optional VAT invoice. The
 * summary is priced by the server for the chosen delivery area; the order is sent once per idempotency key.
 */
function CheckoutForm({
  countries,
  shipping,
  codLimit,
  accounts,
  phoneDisplay,
  whatsappE164,
}: CheckoutFormProps) {
  const t = useTranslations("Checkout");
  const hydrated = useHydrated();
  const { lines, clear } = useCart();
  const prefs = useCartPrefs();
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });
  const { errors, submitCount } = form.formState;
  const [proof, setProof] = useState<SlotFile | null>(null);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<Failure>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const [mode, division, district, payment, vat, phoneCountry, transactionId] = useWatch({
    control: form.control,
    name: [
      "deliveryMode",
      "division",
      "district",
      "payment",
      "vat",
      "phoneCountry",
      "transactionId",
    ],
  });

  const delivery = useMemo<DeliveryChoice>(
    () =>
      mode === "pickup"
        ? { kind: "pickup" }
        : {
            kind: "zone",
            // Until an address is typed, price the area picked on the cart page.
            zoneId:
              division || district
                ? zoneForArea(shipping, { division, district }).id
                : (shipping.zones.find((zone) => zone.id === prefs.zoneId) ?? shipping.zones[0]!)
                    .id,
          },
    [mode, division, district, shipping, prefs.zoneId],
  );
  const { quote, status, retry } = useQuote(lines, prefs.couponCode, delivery);

  const error = (key: keyof CheckoutValues) => {
    const message = errors[key]?.message;
    return message ? t(`errors.${message}` as "errors.nameRequired") : undefined;
  };
  const errorCount = Object.keys(errors).length;
  const codBlocked: "limit" | "item" | "pickup" | null =
    mode === "pickup" ? "pickup" : (quote?.cod.reason ?? null);
  const codChosenButBlocked = payment === COD && codBlocked !== null;
  const firstAccount = accounts[0]?.id;

  // Cash on delivery stops being offered (over the limit, pick-up): move the choice to the first transfer account.
  useEffect(() => {
    if (codChosenButBlocked && firstAccount) form.setValue("payment", firstAccount);
  }, [codChosenButBlocked, firstAccount, form]);

  const submit = form.handleSubmit(async (values) => {
    if (sending || !quote || !quote.ready) return;
    setSending(true);
    setFailure(null);
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: key,
          order: buildOrderInput(values, lines, prefs.couponCode, proof),
        }),
      });
      if (!response.ok) {
        // A refusal is final for this attempt: the next press is a new order request (#61). Server errors and
        // timeouts keep the key, so a retry can never place the order twice.
        if (response.status < 500 && response.status !== 429) setIdempotencyKey(null);
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setFailure(
          response.status === 429
            ? "rate"
            : body.error === "changed"
              ? "changed"
              : body.error === "cod"
                ? "cod"
                : body.error === "minimum"
                  ? "minimum"
                  : "retry",
        );
        return;
      }
      const created = (await response.json()) as { reference: string; total: number };
      const account = accounts.find((item) => item.id === values.payment) ?? null;
      setPlaced({
        reference: created.reference,
        total: created.total,
        email: values.email || undefined,
        pickup: values.deliveryMode === "pickup",
        estimate: quote.deliveryEstimate,
        account,
        transactionId: account ? values.transactionId : undefined,
        phoneDisplay,
      });
      setIdempotencyKey(null);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFailure("retry");
    } finally {
      setSending(false);
    }
  });

  if (placed) {
    return (
      <OrderDone
        reference={placed.reference}
        total={placed.total}
        phoneDisplay={placed.phoneDisplay}
        email={placed.email}
        pickup={placed.pickup}
        estimate={placed.estimate}
        account={placed.account}
        transactionId={placed.transactionId}
        whatsappE164={whatsappE164}
      />
    );
  }
  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" />;
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-mist-200 bg-white px-5 py-14 text-center">
        <h2 className="font-display text-[22px] font-extrabold text-navy-900">
          {t("empty.title")}
        </h2>
        <p className="text-[15px] text-mist-700">{t("empty.lead")}</p>
        <Button asChild>
          <Link href="/shop">{t("empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  const phone = form.register("phone");
  const ready = quote !== null && quote.lines.length > 0;
  const blocked = !ready || !quote.ready || quote.belowMinimum !== null || codChosenButBlocked;

  return (
    <form
      noValidate
      onSubmit={submit}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <p aria-live="polite" className="sr-only">
          {submitCount > 0 && errorCount > 0 ? t("errors.summary") : ""}
        </p>

        <Section n={1} id="checkout-contact-title" title={t("contact.title")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              id="co-name"
              label={
                <>
                  {t("contact.name")} <span aria-hidden="true">*</span>
                </>
              }
              error={error("name")}
            >
              {(describedBy) => (
                <Input
                  id="co-name"
                  autoComplete="name"
                  placeholder={t("contact.namePlaceholder")}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy}
                  {...form.register("name")}
                />
              )}
            </FormField>
            <FormField
              id="co-phone"
              label={
                <>
                  {t("contact.phone")} <span aria-hidden="true">*</span>
                </>
              }
              error={error("phone")}
            >
              {(describedBy) => (
                <PhoneField
                  id="co-phone"
                  countries={countries}
                  country={phoneCountry}
                  onCountryChange={(code) => form.setValue("phoneCountry", code)}
                  countryLabel={t("contact.phoneCountry")}
                  invalid={Boolean(errors.phone)}
                  describedBy={describedBy}
                  inputRef={phone.ref}
                  inputProps={{
                    name: phone.name,
                    onChange: phone.onChange,
                    onBlur: phone.onBlur,
                    inputMode: "tel",
                    autoComplete: "tel-national",
                    placeholder: t("contact.phonePlaceholder"),
                  }}
                />
              )}
            </FormField>
          </div>
          <FormField
            id="co-email"
            label={t("contact.email")}
            hint={t("contact.emailHint")}
            error={error("email")}
          >
            {(describedBy) => (
              <Input
                id="co-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy}
                {...form.register("email")}
              />
            )}
          </FormField>
          <div className="flex items-start gap-3 rounded-2xl bg-mist-50 p-3.5">
            <Controller
              control={form.control}
              name="vat"
              render={({ field }) => (
                <Switch
                  id="co-vat"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="co-vat-hint"
                />
              )}
            />
            <div className="min-w-0">
              <label
                htmlFor="co-vat"
                className="block cursor-pointer text-[15px] font-semibold text-navy-900"
              >
                {t("contact.vatTitle")}
              </label>
              <p id="co-vat-hint" className="text-[13px] text-mist-700">
                {t("contact.vatHint")}
              </p>
            </div>
          </div>
          {vat ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                id="co-company"
                label={
                  <>
                    {t("contact.company")} <span aria-hidden="true">*</span>
                  </>
                }
                error={error("company")}
              >
                {(describedBy) => (
                  <Input
                    id="co-company"
                    autoComplete="organization"
                    placeholder={t("contact.companyPlaceholder")}
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={describedBy}
                    {...form.register("company")}
                  />
                )}
              </FormField>
              <FormField
                id="co-bin"
                label={
                  <>
                    {t("contact.bin")} <span aria-hidden="true">*</span>
                  </>
                }
                error={error("bin")}
              >
                {(describedBy) => (
                  <Input
                    id="co-bin"
                    inputMode="numeric"
                    placeholder={t("contact.binPlaceholder")}
                    aria-invalid={Boolean(errors.bin)}
                    aria-describedby={describedBy}
                    {...form.register("bin")}
                  />
                )}
              </FormField>
            </div>
          ) : null}
        </Section>

        <Section n={2} id="checkout-delivery-title" title={t("delivery.title")}>
          <Controller
            control={form.control}
            name="deliveryMode"
            render={({ field }) => (
              <RadioGroup
                aria-labelledby="checkout-delivery-title"
                value={field.value}
                onValueChange={field.onChange}
                className="grid-cols-1 gap-2.5"
              >
                <RadioCard
                  value="courier"
                  checked={field.value === "courier"}
                  title={
                    quote?.deliveryLabel && mode === "courier"
                      ? quote.deliveryLabel
                      : t("delivery.title")
                  }
                  sub={quote && mode === "courier" ? quote.deliveryEstimate : undefined}
                  aside={
                    quote && mode === "courier" ? (
                      quote.delivery === 0 ? (
                        t("delivery.free")
                      ) : (
                        formatTaka(quote.delivery)
                      )
                    ) : (
                      <Truck aria-hidden="true" className="size-5 text-brand-700" />
                    )
                  }
                />
                {shipping.officePickup ? (
                  <RadioCard
                    value="pickup"
                    checked={field.value === "pickup"}
                    title={t("delivery.pickup")}
                    sub={t("delivery.pickupSub")}
                    aside={<Store aria-hidden="true" className="size-5 text-brand-700" />}
                  />
                ) : null}
              </RadioGroup>
            )}
          />
          {mode === "courier" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                id="co-division"
                label={
                  <>
                    {t("address.division")} <span aria-hidden="true">*</span>
                  </>
                }
                error={error("division")}
              >
                {(describedBy) => (
                  <Controller
                    control={form.control}
                    name="division"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="co-division"
                          className="h-[50px] w-full"
                          aria-invalid={Boolean(errors.division)}
                          aria-describedby={describedBy}
                        >
                          <SelectValue placeholder={t("address.divisionPlaceholder")}>
                            {field.value || undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {DIVISIONS.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </FormField>
              <FormField
                id="co-district"
                label={
                  <>
                    {t("address.district")} <span aria-hidden="true">*</span>
                  </>
                }
                error={error("district")}
              >
                {(describedBy) => (
                  <Input
                    id="co-district"
                    autoComplete="address-level2"
                    placeholder={t("address.districtPlaceholder")}
                    aria-invalid={Boolean(errors.district)}
                    aria-describedby={describedBy}
                    {...form.register("district")}
                  />
                )}
              </FormField>
              <FormField
                id="co-area"
                label={
                  <>
                    {t("address.area")} <span aria-hidden="true">*</span>
                  </>
                }
                error={error("area")}
              >
                {(describedBy) => (
                  <Input
                    id="co-area"
                    autoComplete="address-level3"
                    placeholder={t("address.areaPlaceholder")}
                    aria-invalid={Boolean(errors.area)}
                    aria-describedby={describedBy}
                    {...form.register("area")}
                  />
                )}
              </FormField>
              <FormField
                id="co-street"
                className="md:col-span-3"
                label={
                  <>
                    {t("address.street")} <span aria-hidden="true">*</span>
                  </>
                }
                error={error("street")}
              >
                {(describedBy) => (
                  <Input
                    id="co-street"
                    autoComplete="street-address"
                    placeholder={t("address.streetPlaceholder")}
                    aria-invalid={Boolean(errors.street)}
                    aria-describedby={describedBy}
                    {...form.register("street")}
                  />
                )}
              </FormField>
              <FormField
                id="co-note"
                className="md:col-span-3"
                label={t("address.note")}
                hint={t("address.noteHint")}
                error={error("note")}
              >
                {(describedBy) => (
                  <Textarea
                    id="co-note"
                    rows={2}
                    aria-describedby={describedBy}
                    {...form.register("note")}
                  />
                )}
              </FormField>
            </div>
          ) : null}
        </Section>

        <Section n={3} id="checkout-payment-title" title={t("payment.title")}>
          <PaymentOptions
            accounts={accounts}
            value={payment}
            onChange={(value) =>
              form.setValue("payment", value, { shouldValidate: submitCount > 0 })
            }
            total={quote?.total ?? 0}
            codLimit={codLimit}
            codBlocked={codBlocked}
            transactionId={transactionId}
            onTransaction={(value) =>
              form.setValue("transactionId", value, { shouldValidate: submitCount > 0 })
            }
            transactionError={error("transactionId")}
            transactionProps={{}}
            proof={proof}
            onProof={setProof}
          />
        </Section>
      </div>

      <div className="flex flex-col gap-3">
        {ready ? (
          <CheckoutSummary
            quote={quote}
            sending={sending}
            blocked={blocked}
            loading={status === "loading"}
          />
        ) : status === "error" ? (
          <div role="alert" className="rounded-2xl border border-mist-200 bg-white p-5">
            <p className="text-[14.5px]">{t("errors.failed")}</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={retry}>
              {t("errors.changedCta")}
            </Button>
          </div>
        ) : (
          <Skeleton className="h-96 rounded-2xl" />
        )}
        {failure ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-danger-25 p-3 text-[13.5px] text-danger-600"
          >
            <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
            <span>
              {failure === "rate"
                ? t("errors.rate")
                : failure === "changed"
                  ? t("errors.changed")
                  : failure === "cod"
                    ? t("errors.cod")
                    : failure === "minimum"
                      ? t("errors.minimum")
                      : t("errors.failed")}
              {failure === "changed" || failure === "minimum" ? (
                <>
                  {" "}
                  <Link href="/shop/cart" className="font-semibold underline">
                    {t("errors.changedCta")}
                  </Link>
                </>
              ) : null}
            </span>
          </p>
        ) : null}
        {codChosenButBlocked ? (
          <p role="status" className="text-[13px] text-warning-700">
            {t("errors.cod")}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export { CheckoutForm };
