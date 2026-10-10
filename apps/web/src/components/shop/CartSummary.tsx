"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, BadgePercent, CircleAlert, Check, Lock, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { formatTaka, type Quote } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "@/i18n/navigation";

type CartSummaryProps = {
  quote: Quote;
  zones: Array<{ id: string; name: string; estimate: string }>;
  zoneId: string;
  onZone: (id: string) => void;
  couponCode: string;
  onCoupon: (code: string) => void;
  payWith: string[];
  loading: boolean;
};

/**
 * Order summary (ShopCart): delivery area, the money rows, a coupon field with its states (applied, invalid or
 * expired, below the minimum), the total, and the checkout button. The total rolls when it changes.
 */
function CartSummary({
  quote,
  zones,
  zoneId,
  onZone,
  couponCode,
  onCoupon,
  payWith,
  loading,
}: CartSummaryProps) {
  const t = useTranslations("Cart.summary");
  const [typed, setTyped] = useState(couponCode);
  const saving = quote.mrpTotal - quote.subtotal;
  const allSaving = saving + quote.discount;
  const blocked = !quote.ready || quote.belowMinimum !== null;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    onCoupon(typed.trim().toUpperCase());
  };

  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="flex flex-col gap-3.5 rounded-2xl border border-mist-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:p-5"
    >
      <h2 id="cart-summary-title" className="font-display text-[19px] font-extrabold text-navy-900">
        {t("title")}
      </h2>

      {zones.length > 1 ? (
        <RadioGroup
          aria-label={t("zone")}
          value={zoneId}
          onValueChange={onZone}
          className="grid grid-cols-2 gap-1.5 rounded-full bg-mist-100 p-1"
        >
          {zones.map((zone) => (
            <label
              key={zone.id}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-center justify-center rounded-full px-2 text-center text-[13.5px] font-semibold transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                zoneId === zone.id ? "bg-white text-navy-900 shadow-sm" : "text-mist-700",
              )}
            >
              <RadioGroupItem
                value={zone.id}
                className="absolute inset-0 size-full opacity-0 after:hidden"
              />
              {zone.name}
            </label>
          ))}
        </RadioGroup>
      ) : null}

      <dl className="flex flex-col gap-2 text-[14.5px]">
        <Row label={t("items", { count: quote.count })} value={formatTaka(quote.mrpTotal)} />
        {saving > 0 ? (
          <Row label={t("mrpSaving")} value={`−${formatTaka(saving)}`} tone="success" />
        ) : null}
        {quote.coupon.state === "applied" ? (
          <Row
            label={t("coupon", { code: quote.coupon.code })}
            value={`−${formatTaka(quote.discount)}`}
            tone="success"
          />
        ) : null}
        <Row
          label={
            <>
              {t("delivery")}
              <small className="ml-1.5 text-[12.5px] font-normal text-mist-600">
                {quote.deliveryEstimate}
              </small>
            </>
          }
          value={quote.delivery === 0 ? t("free") : formatTaka(quote.delivery)}
        />
        <div className="mt-1 flex items-baseline justify-between border-t border-mist-200 pt-3">
          <dt className="font-display text-[16px] font-extrabold text-navy-900">{t("total")}</dt>
          <dd
            className={cn(
              "font-display text-[24px] font-extrabold text-navy-900 tabular-nums transition-opacity",
              loading && "opacity-60",
            )}
          >
            {formatTaka(quote.total)}
          </dd>
        </div>
      </dl>

      {allSaving > 0 ? (
        <p className="flex items-center gap-2 rounded-xl bg-success-50 px-3 py-2 text-[13.5px] font-semibold text-success-600">
          <BadgePercent aria-hidden="true" className="size-4 shrink-0" />
          {t("youSave", { amount: formatTaka(allSaving) })}
        </p>
      ) : null}

      <form onSubmit={apply} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            aria-label={t("couponLabel")}
            placeholder={t("couponPlaceholder")}
            value={typed}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            aria-invalid={
              quote.coupon.state === "invalid" || quote.coupon.state === "below-minimum"
            }
            onChange={(event) => setTyped(event.target.value)}
            className="h-12 uppercase"
          />
          <Button type="submit" variant="secondary" disabled={typed.trim() === ""}>
            {t("apply")}
          </Button>
        </div>
        {quote.coupon.state === "applied" ? (
          <p
            role="status"
            className="flex items-center justify-between gap-2 text-[13.5px] font-semibold text-success-600"
          >
            <span className="flex items-center gap-1.5">
              <Check aria-hidden="true" className="size-4" />
              {t("couponApplied", {
                code: quote.coupon.code,
                amount: formatTaka(quote.coupon.discount),
              })}
            </span>
            <button
              type="button"
              aria-label={t("remove")}
              onClick={() => {
                setTyped("");
                onCoupon("");
              }}
              className="grid size-9 place-items-center rounded-full text-mist-700 hover:bg-mist-100"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </p>
        ) : null}
        {quote.coupon.state === "invalid" ? (
          <p role="alert" className="flex items-start gap-1.5 text-[13px] text-danger-600">
            <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {t("couponInvalid")}
          </p>
        ) : null}
        {quote.coupon.state === "below-minimum" ? (
          <p role="alert" className="flex items-start gap-1.5 text-[13px] text-danger-600">
            <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {t("couponMinimum", {
              code: quote.coupon.code,
              amount: formatTaka(quote.coupon.minOrder),
            })}
          </p>
        ) : null}
      </form>

      {quote.belowMinimum !== null ? (
        <p role="status" className="text-[13px] text-warning-700">
          {t("minimum", {
            amount: formatTaka(quote.subtotal + quote.belowMinimum),
            short: formatTaka(quote.belowMinimum),
          })}
        </p>
      ) : null}

      <Button asChild={!blocked} size="lg" className="w-full" disabled={blocked}>
        {blocked ? (
          <span>
            {t("checkout")}
            <ArrowRight aria-hidden="true" />
          </span>
        ) : (
          <Link href="/shop/checkout">
            {t("checkout")}
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </Button>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-mist-700">
        <span className="font-semibold text-ink-900">{t("payWith")}</span>
        {payWith.map((method) => (
          <span key={method} className="rounded-full bg-mist-100 px-2.5 py-1 font-medium">
            {method}
          </span>
        ))}
      </p>
      <p className="flex items-start gap-1.5 text-[12.5px] text-mist-600">
        <Lock aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        {t("pricesNote")}
      </p>
    </aside>
  );
}

function Row({ label, value, tone }: { label: React.ReactNode; value: string; tone?: "success" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-mist-700">{label}</dt>
      <dd
        className={cn(
          "font-semibold tabular-nums",
          tone === "success" ? "text-success-600" : "text-ink-900",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export { CartSummary };
