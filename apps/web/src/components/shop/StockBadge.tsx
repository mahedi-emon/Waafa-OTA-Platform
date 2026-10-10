import { cn } from "cn";
import type { StockBadge as StockBadgeKind } from "@/lib/shop/variants";

const TONES: Record<StockBadgeKind, string> = {
  "in-stock": "bg-success-50 text-success-600",
  "low-stock": "bg-warning-50 text-warning-700",
  "out-of-stock": "bg-mist-100 text-mist-600",
  "pre-order": "bg-electric-50 text-brand-700",
};

type StockBadgeProps = { kind: StockBadgeKind; label: string; className?: string };

/** In stock, Low stock, Out of stock or Pre-order (FR-SHOP-03), colour plus words. */
function StockBadge({ kind, label, className }: StockBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold",
        TONES[kind],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export { StockBadge };
