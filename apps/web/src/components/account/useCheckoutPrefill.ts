"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { checkoutPrefill, type AccountSummary } from "@/lib/account/checkoutPrefill";
import type { CheckoutValues } from "@/lib/shop/checkoutForm";

const HINT = "waafa_customer_hint=1";

/**
 * Checkout for a signed-in customer (issue 278): after hydration, the name, email, phone and default address from
 * My account fill the empty fields. Anything already typed stays as it is.
 */
export function useCheckoutPrefill(form: UseFormReturn<CheckoutValues>) {
  useEffect(() => {
    if (!document.cookie.split("; ").includes(HINT)) return;
    const controller = new AbortController();
    fetch("/api/account/summary", { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<AccountSummary>) : null))
      .then((summary) => {
        if (!summary) return;
        const values = checkoutPrefill(summary, form.getValues());
        for (const [field, value] of Object.entries(values)) {
          form.setValue(field as keyof typeof values, value, { shouldDirty: true });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [form]);
}
