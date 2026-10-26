"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { SlotFile } from "@/components/forms/DocumentSlot";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { TradingStepValues } from "@/lib/leads/serviceLeadForm";

/** Step 2 and its validation load when the visitor reaches it, not with the page (issues 170 and 236). */
const TradingStep = dynamic(() => import("./TradingStep").then((mod) => mod.TradingStep), {
  loading: () => <Skeleton className="mx-5 my-6 h-[520px] rounded-2xl md:mx-7" />,
});

type TradingRequestProps = {
  title: string;
  lead: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** International Trading RFQ (Trading, Trading-done): the shared two-step request, TRD reference. */
function TradingRequest(props: TradingRequestProps) {
  const t = useTranslations("Services");
  const tt = useTranslations("Services.trading");
  const [values, setValues] = useState<TradingStepValues>({
    company: "",
    direction: "import",
    product: "",
    quantity: "",
    unit: tt("units.cartons"),
    country: "",
    specifications: "",
    targetPrice: "",
    deliveryTerms: "",
    timeline: "",
    notes: "",
    consent: false,
  });
  const [file, setFile] = useState<SlotFile | null>(null);

  return (
    <LeadRequestCard<TradingStepValues>
      titleId="trading-request-title"
      kicker={tt("kicker")}
      title={props.title}
      lead={props.lead}
      secondStepLabel={tt("stepLabel")}
      contactCopy={{ title: t("contactTitle"), emailHint: t("contactEmailHint") }}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={async (contact, form, page) =>
        (await import("@/lib/leads/serviceLeadForm")).buildTradingLead({
          contact,
          values: form,
          file,
          page,
        })
      }
      renderSecondStep={({ sending, goBack, submit }) => (
        <TradingStep
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
        title: tt("success.title"),
        lead: tt("success.lead"),
        steps: [
          { title: tt("success.step1Title"), body: tt("success.step1Body") },
          { title: tt("success.step2Title"), body: tt("success.step2Body") },
          { title: tt("success.step3Title"), body: tt("success.step3Body") },
        ],
        whatsappMessage: (reference) => tt("success.whatsappMessage", { reference }),
        againHref: "/shop",
        againLabel: tt("success.again"),
      }}
    />
  );
}

export { TradingRequest };
