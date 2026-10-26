"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { SlotFile } from "@/components/forms/DocumentSlot";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PrintingStepValues } from "@/lib/leads/serviceLeadForm";

/** Step 2 and its validation load when the visitor reaches it, not with the page (issues 170 and 236). */
const PrintingStep = dynamic(() => import("./PrintingStep").then((mod) => mod.PrintingStep), {
  loading: () => <Skeleton className="mx-5 my-6 h-[520px] rounded-2xl md:mx-7" />,
});

type RequestProps = {
  title: string;
  lead: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** Printing Solutions quote (Printing, Printing-done): the shared two-step request, PRN reference. */
function PrintingRequest(props: RequestProps) {
  const t = useTranslations("Services");
  const tp = useTranslations("Services.printing");
  const [values, setValues] = useState<PrintingStepValues>({
    company: "",
    service: "toner-supply",
    printers: "",
    pages: "",
    branches: "",
    frequency: "monthly",
    location: "",
    models: "",
    notes: "",
    consent: false,
  });
  const [file, setFile] = useState<SlotFile | null>(null);

  return (
    <LeadRequestCard<PrintingStepValues>
      titleId="printing-request-title"
      kicker={tp("kicker")}
      title={props.title}
      lead={props.lead}
      secondStepLabel={tp("stepLabel")}
      contactCopy={{ title: t("contactTitle"), emailHint: t("contactEmailHint") }}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={async (contact, form, page) =>
        (await import("@/lib/leads/serviceLeadForm")).buildPrintingLead({
          contact,
          values: form,
          file,
          page,
          labels: {
            printers: tp("printers"),
            pages: tp("pages"),
            branches: tp("branches"),
            models: tp("models"),
          },
        })
      }
      renderSecondStep={({ sending, goBack, submit }) => (
        <PrintingStep
          defaultValues={values}
          consentText={props.consentText}
          sending={sending}
          file={file}
          onFile={setFile}
          onBack={(next) => {
            setValues(next);
            goBack();
          }}
          onSubmit={(next) => {
            setValues(next);
            submit(next);
          }}
        />
      )}
      success={{
        title: tp("success.title"),
        lead: tp("success.lead"),
        steps: [
          { title: tp("success.step1Title"), body: tp("success.step1Body") },
          { title: tp("success.step2Title"), body: tp("success.step2Body") },
          { title: tp("success.step3Title"), body: tp("success.step3Body") },
        ],
        whatsappMessage: (reference) => tp("success.whatsappMessage", { reference }),
        againHref: "/shop",
        againLabel: tp("success.again"),
      }}
    />
  );
}

export { PrintingRequest };
