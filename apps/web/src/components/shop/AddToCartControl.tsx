"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { CartLine } from "@/lib/shop/cart";
import { useCart } from "./useCart";

type AddToCartControlProps = {
  line: Omit<CartLine, "qty">;
  labels: { add: string; addLabel: string; decrease: string; increase: string; added: string };
  className?: string;
};

/**
 * Card cart control (FR-SHOP-03): "Add to cart" becomes a quantity stepper once the item is in the cart. Sits above the
 * card's stretched link (relative z-10) so it never opens the product page.
 */
function AddToCartControl({ line, labels, className }: AddToCartControlProps) {
  const { lines, add, setQty } = useCart();
  const qty = lines.find((item) => item.variantId === line.variantId)?.qty ?? 0;

  if (qty === 0) {
    return (
      <Button
        type="button"
        variant="soft"
        size="sm"
        aria-label={labels.addLabel}
        className={cn("relative z-10 w-full", className)}
        onClick={() => {
          add({ ...line, qty: 1 });
          toast.success(labels.added, { description: line.title });
        }}
      >
        <ShoppingCart aria-hidden="true" />
        {labels.add}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={line.title}
      className={cn(
        "relative z-10 flex h-[38px] w-full items-center justify-between rounded-full bg-electric-50",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.decrease}
        onClick={() => setQty(line.variantId, qty - 1)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <output
        aria-live="polite"
        className="font-display text-[15px] font-extrabold text-navy-900 tabular-nums"
      >
        {qty}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.increase}
        aria-disabled={qty >= line.maxQty}
        onClick={() => qty < line.maxQty && setQty(line.variantId, qty + 1)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}

export { AddToCartControl };
