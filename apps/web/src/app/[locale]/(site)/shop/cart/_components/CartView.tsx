"use client";

import { useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeliveryChoice } from "@waafa/shared";
import { CartLineRow } from "@/components/shop/CartLineRow";
import { CartSummary } from "@/components/shop/CartSummary";
import { EmptyCart } from "@/components/shop/EmptyCart";
import { FreeDeliveryBar } from "@/components/shop/FreeDeliveryBar";
import { useCart } from "@/components/shop/useCart";
import { useCartPrefs } from "@/components/shop/useCartPrefs";
import { useQuote } from "@/components/shop/useQuote";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useHydrated } from "@/lib/useHydrated";

type CartViewProps = {
  storeName: string;
  zones: Array<{ id: string; name: string; estimate: string }>;
  freeDeliveryThreshold: number | null;
  payWith: string[];
  categories: Array<{ slug: string; name: string }>;
};

/**
 * The cart page body (ShopCart): the guest cart from localStorage, priced by the server (current price, stock and
 * coupon), with the delivery area chosen for the quote. Quantities the server lowered are applied to the cart.
 */
function CartView({ storeName, zones, freeDeliveryThreshold, payWith, categories }: CartViewProps) {
  const t = useTranslations("Cart");
  const hydrated = useHydrated();
  const { lines, setQty, remove } = useCart();
  const prefs = useCartPrefs();
  const zoneId = zones.some((zone) => zone.id === prefs.zoneId)
    ? prefs.zoneId
    : (zones[0]?.id ?? "");
  const delivery = useMemo<DeliveryChoice | null>(
    () => (zoneId ? { kind: "zone", zoneId } : null),
    [zoneId],
  );
  const { quote, status, retry } = useQuote(lines, prefs.couponCode, delivery);

  const priced = useMemo(
    () => new Map(quote?.lines.map((line) => [line.variantId, line]) ?? []),
    [quote],
  );

  // The server is the authority on stock: lower the cart to what can be ordered.
  useEffect(() => {
    if (!quote) return;
    for (const line of quote.lines) {
      const mine = lines.find((item) => item.variantId === line.variantId);
      if (mine && line.status === "adjusted" && mine.qty > line.quantity) {
        setQty(line.variantId, line.quantity);
      }
    }
  }, [quote, lines, setQty]);

  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" aria-label={t("summary.loading")} />;
  if (lines.length === 0) return <EmptyCart storeName={storeName} categories={categories} />;

  const ready = quote !== null && quote.lines.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
        {ready && freeDeliveryThreshold !== null ? (
          <FreeDeliveryBar subtotal={quote.subtotal} threshold={freeDeliveryThreshold} />
        ) : null}
        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <CartLineRow
              key={line.variantId}
              line={line}
              priced={priced.get(line.variantId)}
              onQty={(qty) => setQty(line.variantId, qty)}
              onRemove={() => remove(line.variantId)}
            />
          ))}
        </ul>
        <Button asChild variant="ghost" className="self-start">
          <Link href="/shop">
            <ArrowLeft aria-hidden="true" />
            {t("continue")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {ready ? (
          <CartSummary
            quote={quote}
            zones={zones}
            zoneId={zoneId}
            onZone={prefs.setZoneId}
            couponCode={prefs.couponCode}
            onCoupon={prefs.setCouponCode}
            payWith={payWith}
            loading={status === "loading"}
          />
        ) : status === "error" ? (
          <div role="alert" className="rounded-2xl border border-mist-200 bg-white p-5">
            <p className="text-[14.5px] text-ink-900">{t("summary.error")}</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={retry}>
              {t("summary.retry")}
            </Button>
          </div>
        ) : (
          <Skeleton className="h-96 rounded-2xl" aria-label={t("summary.loading")} />
        )}
        {ready && status === "error" ? (
          <p role="alert" className="text-[13px] text-danger-600">
            {t("summary.error")}{" "}
            <button type="button" onClick={retry} className="font-semibold underline">
              {t("summary.retry")}
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { CartView };
