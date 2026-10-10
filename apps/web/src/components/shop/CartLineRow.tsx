"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { formatTaka, type PricedLine } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { RollingNumber } from "@/components/motion/RollingNumber";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { CartLine } from "@/lib/shop/cart";

type CartLineRowProps = {
  line: CartLine;
  /** The current price and stock from the catalogue; the stored snapshot is shown until it arrives. */
  priced?: PricedLine;
  onQty: (qty: number) => void;
  onRemove: () => void;
};

/** One cart line (ShopCart): photo, title, variant, unit price, stock note, quantity stepper and the line total. */
function CartLineRow({ line, priced, onQty, onRemove }: CartLineRowProps) {
  const t = useTranslations("Cart.line");
  const unit = priced?.unitPrice ?? line.price;
  const max = priced?.maxQuantity ?? line.maxQty;
  const qty = line.qty;
  const unavailable = priced?.status === "unavailable";
  const image = priced?.image ?? line.image;

  return (
    <li
      className={cn(
        "grid grid-cols-[72px_1fr] gap-x-3.5 gap-y-3 rounded-2xl border border-mist-200 bg-white p-3.5 sm:grid-cols-[96px_1fr_auto] sm:gap-x-4 sm:p-4",
        unavailable && "border-danger-600/40 bg-danger-25",
      )}
    >
      <Link
        href={`/shop/p/${line.slug}`}
        aria-label={line.title}
        className="relative block size-[72px] overflow-hidden rounded-xl bg-mist-50 sm:size-24"
      >
        {image ? (
          <SmartImage src={image.src} alt="" fill sizes="96px" className="object-contain p-1.5" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-col gap-1">
        <Link
          href={`/shop/p/${line.slug}`}
          className="line-clamp-2 text-[15px] leading-snug font-semibold text-navy-900 hover:text-brand-700"
        >
          {line.title}
        </Link>
        {line.variantLabel ? (
          <p className="text-[13px] text-mist-700">{line.variantLabel}</p>
        ) : null}
        <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-mist-700">
          <span className="tabular-nums">{t("each", { price: formatTaka(unit) })}</span>
          {priced?.mrp && priced.mrp > unit ? (
            <s className="text-mist-500 tabular-nums">{formatTaka(priced.mrp)}</s>
          ) : null}
          {max > 0 && max <= 5 && priced && !unavailable ? (
            <span className="font-semibold text-warning-700">{t("onlyLeft", { count: max })}</span>
          ) : null}
        </p>
        {priced?.status === "adjusted" ? (
          <p role="status" className="text-[13px] font-medium text-warning-700">
            {t("adjusted", { count: priced.maxQuantity })}
          </p>
        ) : null}
        {unavailable ? (
          <p role="alert" className="text-[13px] font-semibold text-danger-600">
            {t("unavailable")}
          </p>
        ) : null}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-mist-100 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-between sm:border-0 sm:pt-0">
        <div
          role="group"
          aria-label={`${t("quantity")}: ${line.title}`}
          className="flex h-11 items-center rounded-full bg-electric-50"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("less", { title: line.title })}
            onClick={() => onQty(qty - 1)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <output
            aria-live="polite"
            className="min-w-8 text-center font-display text-[16px] font-extrabold text-navy-900"
          >
            <RollingNumber value={qty} />
          </output>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("more", { title: line.title })}
            aria-disabled={qty >= max}
            onClick={() => qty < max && onQty(qty + 1)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <p className="font-display text-[18px] font-extrabold text-navy-900 tabular-nums">
          {formatTaka(unit * qty)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("removeLabel", { title: line.title })}
          onClick={onRemove}
          className="text-mist-700 sm:-mr-2"
        >
          <Trash2 aria-hidden="true" />
          {t("remove")}
        </Button>
      </div>
    </li>
  );
}

export { CartLineRow };
