"use client";

import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics/track";
import { addLine, cartCount, removeLine, setLineQty, type CartLine } from "@/lib/shop/cart";
import { createLineStore } from "./lineStore";

/*
 * Guest cart in localStorage (FR-SHOP-06: carts persist across visits), shared by every tab through the storage
 * event. "Saved for later" (issue 246) is a second list on the same device; moving a line keeps its quantity.
 */

const cart = createLineStore("waafa:cart:v1");
const saved = createLineStore("waafa:saved:v1");

/** Adds a line outside React (the card button before its control has loaded, issue 295; Buy again, issue 246). */
export function addToCart(line: CartLine): void {
  cart.write(addLine(cart.read(), line));
  track("add_to_cart", { item_id: line.variantId });
}

/** Moves a cart line to "Saved for later" (issue 246). */
export function saveForLater(variantId: string): void {
  const line = cart.read().find((item) => item.variantId === variantId);
  if (!line) return;
  saved.write([line, ...removeLine(saved.read(), variantId)]);
  cart.write(removeLine(cart.read(), variantId));
}

/** Moves a saved line back into the cart. */
export function moveToCart(variantId: string): void {
  const line = saved.read().find((item) => item.variantId === variantId);
  if (!line) return;
  cart.write(addLine(cart.read(), line));
  saved.write(removeLine(saved.read(), variantId));
}

export function useCart() {
  const lines = useSyncExternalStore(cart.subscribe, cart.read, cart.empty);
  return {
    lines,
    count: cartCount(lines),
    add: addToCart,
    setQty: (variantId: string, qty: number) => cart.write(setLineQty(cart.read(), variantId, qty)),
    remove: (variantId: string) => cart.write(removeLine(cart.read(), variantId)),
    clear: () => cart.write([]),
  };
}

/** The "Saved for later" list on this device (issue 246). */
export function useSavedForLater() {
  const lines = useSyncExternalStore(saved.subscribe, saved.read, saved.empty);
  return {
    lines,
    save: saveForLater,
    moveToCart,
    remove: (variantId: string) => saved.write(removeLine(saved.read(), variantId)),
  };
}
