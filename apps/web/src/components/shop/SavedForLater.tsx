"use client";

import { useTranslations } from "next-intl";
import { formatTaka } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import type { CartLine } from "@/lib/shop/cart";

type SavedForLaterProps = {
  lines: CartLine[];
  onMove: (variantId: string) => void;
  onRemove: (variantId: string) => void;
};

/**
 * Lines moved out of the cart for later (issue 246), kept on this device. Prices are the ones seen when saved; the
 * cart prices them again when they move back.
 */
function SavedForLater({ lines, onMove, onRemove }: SavedForLaterProps) {
  const t = useTranslations("Cart.saved");
  if (lines.length === 0) return null;
  return (
    <section aria-labelledby="cart-saved" className="flex flex-col gap-3">
      <h2 id="cart-saved" className="font-display text-[18px] font-bold text-navy-900">
        {t("title", { count: lines.length })}
      </h2>
      <ul className="flex flex-col gap-2">
        {lines.map((line) => (
          <li
            key={line.variantId}
            className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold break-words text-navy-900">{line.title}</p>
              <p className="text-[13.5px] text-mist-600">
                {[line.variantLabel, `${line.qty} × ${formatTaka(line.price)}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="min-h-11 sm:min-h-9"
                aria-label={t("moveLabel", { title: line.title })}
                onClick={() => onMove(line.variantId)}
              >
                {t("move")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-11 sm:min-h-9"
                aria-label={t("removeLabel", { title: line.title })}
                onClick={() => onRemove(line.variantId)}
              >
                {t("remove")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { SavedForLater };
