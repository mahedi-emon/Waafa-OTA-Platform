"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmiRequestValues } from "@/lib/leads/emiLeadForm";

export type EmiRequestLabels = {
  kicker: string;
  title: string;
  lead: string;
  step: string;
  stepTitle: string;
  amount: string;
  amountHint: string;
  months: string;
  /** "{months}" is replaced. */
  monthsOption: string;
  bank: string;
  bankUnsure: string;
  notes: string;
  notesPlaceholder: string;
  submit: string;
  contactTitle: string;
  emailHint: string;
  errors: {
    amountRequired: string;
    amountBelowMinimum: string;
    monthsRequired: string;
    bankRequired: string;
  };
  success: {
    title: string;
    lead: string;
    steps: Array<{ title: string; body: string }>;
    /** "{reference}" is replaced. */
    whatsappMessage: string;
    again: string;
  };
};

type EmiRequestDialogProps = {
  trigger: ReactNode;
  labels: EmiRequestLabels;
  minimum: number;
  tenures: number[];
  banks: Array<{ id: string; name: string }>;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** The request form loads when the dialog first opens, so /emi's first load stays small (D174). */
const EmiRequestForm = dynamic(() => import("./EmiRequestForm").then((mod) => mod.EmiRequestForm), {
  loading: () => <Skeleton className="m-5 h-[460px] rounded-2xl md:m-7" />,
});

/** "Request an EMI plan" (PRD §11, issue 233): the shared two-step request in a dialog, EMI reference. */
function EmiRequestDialog({ trigger, labels, ...props }: EmiRequestDialogProps) {
  const [values, setValues] = useState<EmiRequestValues>({
    amount: "",
    tenureMonths: String(props.tenures[0] ?? ""),
    bank: "",
    notes: "",
    consent: false,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] max-w-[min(640px,calc(100vw-24px))] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{labels.title}</DialogTitle>
        <DialogDescription className="sr-only">{labels.lead}</DialogDescription>
        <EmiRequestForm labels={labels} values={values} setValues={setValues} {...props} />
      </DialogContent>
    </Dialog>
  );
}

export { EmiRequestDialog };
