import { beforeEach, describe, expect, it } from "vitest";
import type { CartLine } from "@/lib/shop/cart";
import { addToCart, moveToCart, saveForLater } from "./useCart";

const line = (variantId: string, qty = 1): CartLine => ({
  productId: "p",
  variantId,
  slug: "p",
  title: `Item ${variantId}`,
  variantLabel: "",
  sku: variantId,
  price: 100,
  qty,
  maxQty: 10,
});

/** The tests run in Node: a tiny localStorage is enough for the stores. */
const storage = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      clear: () => storage.clear(),
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  },
});

const read = (key: string) => JSON.parse(window.localStorage.getItem(key) ?? "[]") as CartLine[];

describe("Save for later (issue 246)", () => {
  beforeEach(() => window.localStorage.clear());

  it("moves a line from the cart to the saved list and back, keeping its quantity", () => {
    addToCart(line("a", 3));
    addToCart(line("b"));
    saveForLater("a");
    expect(read("waafa:cart:v1").map((item) => item.variantId)).toEqual(["b"]);
    expect(read("waafa:saved:v1")).toEqual([expect.objectContaining({ variantId: "a", qty: 3 })]);
    moveToCart("a");
    expect(read("waafa:saved:v1")).toEqual([]);
    expect(read("waafa:cart:v1").find((item) => item.variantId === "a")?.qty).toBe(3);
  });

  it("ignores a line that is not there", () => {
    saveForLater("missing");
    moveToCart("missing");
    expect(read("waafa:cart:v1")).toEqual([]);
    expect(read("waafa:saved:v1")).toEqual([]);
  });
});
