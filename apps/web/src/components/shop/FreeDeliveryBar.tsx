import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatTaka } from "@waafa/shared";

type FreeDeliveryBarProps = {
  subtotal: number;
  threshold: number;
};

/** "Add ৳X more for free delivery" with a progress bar (ShopCart free-shipping strip). */
function FreeDeliveryBar({ subtotal, threshold }: FreeDeliveryBarProps) {
  const t = useTranslations("Cart.freeShip");
  const reached = subtotal >= threshold;
  const percent = Math.max(0, Math.min(100, Math.round((subtotal / threshold) * 100)));

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-electric-100 bg-electric-50 p-3.5">
      <Truck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold text-navy-900">
          {reached ? t("reached") : t("remaining", { amount: formatTaka(threshold - subtotal) })}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t("reachedSub", { amount: formatTaka(threshold) })}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"
        >
          <div
            className="h-full origin-left rounded-full bg-electric-600 transition-transform duration-500 motion-reduce:transition-none"
            style={{ transform: `scaleX(${percent / 100})` }}
          />
        </div>
        <p className="mt-1.5 text-[12.5px] text-mist-700">
          {t("reachedSub", { amount: formatTaka(threshold) })}
        </p>
      </div>
    </div>
  );
}

export { FreeDeliveryBar };
