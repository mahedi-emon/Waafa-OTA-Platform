"use client";

import { ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "./useCart";

type CartButtonProps = { label: string };

/** Cart link with the live item count (ShopBar); the name reads "Cart (3)". */
function CartButton({ label }: CartButtonProps) {
  const { count } = useCart();
  return (
    <Link
      href="/shop/cart"
      className="relative inline-flex size-12 shrink-0 items-center justify-center gap-2 rounded-full border border-mist-200 bg-white text-[14px] font-semibold text-navy-900 outline-none hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40 sm:w-auto sm:px-4"
    >
      <ShoppingCart aria-hidden="true" className="size-5" />
      <span className="sr-only sm:not-sr-only">{label}</span>
      {count > 0 ? (
        <>
          <span className="sr-only"> ({count})</span>
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-electric-600 px-1 text-[11px] font-bold text-white tabular-nums"
          >
            {count > 99 ? "99+" : count}
          </span>
        </>
      ) : null}
    </Link>
  );
}

export { CartButton };
