"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { LazyDialog } from "@/components/layout/LazyDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { BulkQuoteValues } from "@/lib/leads/bulkLeadForm";

export type BulkQuoteLabels = {
  kicker: string;
  title: string;
  lead: string;
  step: string;
  stepTitle: string;
  company: string;
  items: string;
  itemsPlaceholder: string;
  notes: string;
  submit: string;
  contactTitle: string;
  emailHint: string;
  errors: { companyRequired: string; itemsRequired: string };
  success: {
    title: string;
    lead: string;
    steps: Array<{ title: string; body: string }>;
    /** "{reference}" is replaced. */
    whatsappMessage: string;
    again: string;
  };
};

type BulkQuoteDialogProps = {
  trigger: ReactNode;
  labels: BulkQuoteLabels;
  /** Prefills the list on a product page, e.g. "Better Day CF280A, quantity: ". */
  initialItems?: string;
  productSlug?: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** The request form loads when the dialog first opens (issue 170). */
const BulkQuoteForm = dynamic(() => import("./BulkQuoteForm").then((mod) => mod.BulkQuoteForm), {
  loading: () => <Skeleton className="m-5 h-[460px] rounded-2xl md:m-7" />,
});

/** "Get a corporate quote" (Shop-bulk, ShopProduct-bulk): the shared two-step request in a dialog, QTE reference. */
function BulkQuoteDialog({
  trigger,
  labels,
  initialItems = "",
  productSlug,
  ...props
}: BulkQuoteDialogProps) {
  const [values, setValues] = useState<BulkQuoteValues>({
    company: "",
    items: initialItems,
    notes: "",
    consent: false,
  });

  return (
    <LazyDialog trigger={trigger} title={labels.title} description={labels.lead}>
      <BulkQuoteForm
        labels={labels}
        {...(productSlug ? { productSlug } : {})}
        values={values}
        setValues={setValues}
        {...props}
      />
    </LazyDialog>
  );
}

export { BulkQuoteDialog };
