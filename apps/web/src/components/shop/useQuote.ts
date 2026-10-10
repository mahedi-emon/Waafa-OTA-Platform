"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeliveryChoice, Quote } from "@waafa/shared";
import type { CartLine } from "@/lib/shop/cart";

export type QuoteState = { quote: Quote | null; status: "idle" | "loading" | "error" };

/**
 * Prices the guest cart from the current catalogue (POST /api/shop/quote). The browser sends variant ids and
 * quantities only; the quote keeps the last good answer while a new one loads, so totals never blink to nothing.
 * `retry` re-asks after an error.
 */
export function useQuote(
  lines: readonly CartLine[],
  couponCode: string,
  delivery: DeliveryChoice | null,
): QuoteState & { retry: () => void } {
  const [state, setState] = useState<QuoteState>({ quote: null, status: "idle" });
  const [attempt, setAttempt] = useState(0);

  const key = useMemo(
    () =>
      JSON.stringify({
        lines: lines.map((line) => [line.variantId, line.qty]),
        couponCode,
        delivery,
      }),
    [lines, couponCode, delivery],
  );

  useEffect(() => {
    if (lines.length === 0 || !delivery) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch("/api/shop/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.qty })),
            ...(couponCode ? { couponCode } : {}),
            delivery,
          }),
        });
        if (!response.ok) throw new Error(String(response.status));
        setState({ quote: (await response.json()) as Quote, status: "idle" });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState((current) => ({ ...current, status: "error" }));
      }
    }, 120);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // `key` stands for lines, couponCode and delivery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
