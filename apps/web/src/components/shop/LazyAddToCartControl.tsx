"use client";

import { useEffect, useState, type ComponentType } from "react";
import { ShoppingCart } from "lucide-react";
import { cn } from "cn";
import { notify } from "@/components/feedback/notify";
import { Button } from "@/components/ui/button";
import type { AddToCartControlProps } from "./AddToCartControl";

/**
 * The card's cart control, loaded right after the page wakes up instead of with it (issue 295): Home and the store
 * lists stay within 200 KB of first-load script. Until it arrives the same "Add to cart" button shows and still
 * adds the item, so nothing moves and no tap is lost.
 */
function LazyAddToCartControl(props: AddToCartControlProps) {
  const [Control, setControl] = useState<ComponentType<AddToCartControlProps> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./AddToCartControl").then(({ AddToCartControl }) => {
      if (live) setControl(() => AddToCartControl);
    });
    return () => {
      live = false;
    };
  }, []);

  if (Control) return <Control {...props} />;
  return (
    <Button
      type="button"
      variant="soft"
      size="sm"
      aria-label={props.labels.addLabel}
      className={cn("relative z-10 w-full", props.className)}
      onClick={(event) => {
        // A tap before the control arrives still adds the item.
        const from = event.currentTarget;
        void Promise.all([import("./useCart"), import("@/lib/shop/flyToCart")]).then(
          ([cart, arc]) => {
            arc.flyToCart(from);
            cart.addToCart({ ...props.line, qty: 1 });
            notify("success", props.labels.added, { description: props.line.title });
          },
        );
      }}
    >
      <ShoppingCart aria-hidden="true" />
      {props.labels.add}
    </Button>
  );
}

export { LazyAddToCartControl };
