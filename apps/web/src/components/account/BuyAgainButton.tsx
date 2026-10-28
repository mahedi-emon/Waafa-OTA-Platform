"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/components/shop/useCart";
import { useRouter } from "@/i18n/navigation";
import type { CartLine } from "@/lib/shop/cart";

/** "Buy again" on a past order (issue 246): its items go into the cart at today's prices, then the cart opens. */
function BuyAgainButton({ lines, label }: { lines: CartLine[]; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="min-h-11 self-start sm:min-h-9"
      loading={busy}
      onClick={() => {
        setBusy(true);
        for (const line of lines) addToCart(line);
        router.push("/shop/cart");
      }}
    >
      {label}
    </Button>
  );
}

export { BuyAgainButton };
