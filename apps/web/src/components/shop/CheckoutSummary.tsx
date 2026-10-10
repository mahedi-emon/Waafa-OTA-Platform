import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatTaka, type Quote } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type CheckoutSummaryProps = {
  quote: Quote;
  sending: boolean;
  blocked: boolean;
  loading: boolean;
};

/** Checkout order summary (ShopCheckout aside): the lines, the money rows and Place order. */
function CheckoutSummary({ quote, sending, blocked, loading }: CheckoutSummaryProps) {
  const t = useTranslations("Checkout.summary");
  return (
    <aside
      aria-labelledby="checkout-summary-title"
      className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="checkout-summary-title"
          className="font-display text-[19px] font-extrabold text-navy-900"
        >
          {t("title")}
        </h2>
        <Link
          href="/shop/cart"
          className="text-[13.5px] font-semibold text-brand-700 hover:underline"
        >
          {t("edit")}
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {quote.lines.map((line) => (
          <li key={line.variantId} className="flex items-center gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-mist-50">
              {line.image ? (
                <SmartImage
                  src={line.image.src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              ) : null}
              <span className="absolute -top-0 -right-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-navy-900 px-1 text-[11px] font-bold text-white tabular-nums">
                {line.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[14px] leading-snug font-medium text-ink-900">
                {line.title}
              </span>
              {line.variantLabel ? (
                <span className="block text-[12.5px] text-mist-600">{line.variantLabel}</span>
              ) : null}
            </span>
            <span className="text-[14px] font-semibold text-ink-900 tabular-nums">
              {formatTaka(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-mist-200 pt-3 text-[14.5px]">
        <div className="flex justify-between gap-3">
          <dt className="text-mist-700">{t("subtotal")}</dt>
          <dd className="font-semibold tabular-nums">{formatTaka(quote.subtotal)}</dd>
        </div>
        {quote.discount > 0 && quote.coupon.state === "applied" ? (
          <div className="flex justify-between gap-3 text-success-600">
            <dt>{t("coupon", { code: quote.coupon.code })}</dt>
            <dd className="font-semibold tabular-nums">−{formatTaka(quote.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-mist-700">
            {t("delivery")}
            <small className="ml-1.5 text-[12.5px] text-mist-600">{quote.deliveryEstimate}</small>
          </dt>
          <dd className="font-semibold tabular-nums">
            {quote.delivery === 0 ? t("free") : formatTaka(quote.delivery)}
          </dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between border-t border-mist-200 pt-3">
          <dt className="font-display text-[16px] font-extrabold text-navy-900">{t("total")}</dt>
          <dd
            className={
              loading
                ? "font-display text-[24px] font-extrabold text-navy-900 tabular-nums opacity-60"
                : "font-display text-[24px] font-extrabold text-navy-900 tabular-nums"
            }
          >
            {formatTaka(quote.total)}
          </dd>
        </div>
      </dl>
      <Button type="submit" size="lg" className="w-full" loading={sending} disabled={blocked}>
        {sending ? t("placing") : t("place")}
      </Button>
      <p className="flex items-start gap-1.5 text-[12.5px] text-mist-600">
        <Lock aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        {t("secure")}
      </p>
    </aside>
  );
}

export { CheckoutSummary };
