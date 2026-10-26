"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckoutForm as CheckoutFormType } from "./CheckoutForm";

/**
 * The checkout reads the cart from the device, so the server always sent a placeholder for it. The form's code (react-
 * hook-form, payment options, the order summary) now loads after the page is interactive instead of with it, behind
 * the same placeholder (issue 236).
 */
const CheckoutForm = dynamic(() => import("./CheckoutForm").then((mod) => mod.CheckoutForm), {
  ssr: false,
  loading: () => <Skeleton className="h-96 rounded-2xl" />,
});

function CheckoutFormLoader(props: ComponentProps<typeof CheckoutFormType>) {
  return <CheckoutForm {...props} />;
}

export { CheckoutFormLoader };
