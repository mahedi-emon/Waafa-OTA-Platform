"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import { planTripDefaults } from "@/lib/leads/planTripLeadFormFields";
import type { PlanTripInput, PlanTripValues } from "@/lib/leads/planTripLeadForm";

/** Step 2 and its validation load when the visitor reaches it, not with the page (issues 170 and 236). */
const PlanStep = dynamic(() => import("./PlanStep").then((mod) => mod.PlanStep), {
  loading: () => <Skeleton className="mx-5 my-6 h-[520px] rounded-2xl md:mx-7" />,
});

type PlanTripRequestProps = {
  /** A place carried from a link such as /plan-my-trip?place=Bali. */
  place?: string;
  places: { domestic: string[]; abroad: string[] };
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** Plan my trip (FR-PKG-07): the shared two-step request with a CTR reference. */
function PlanTripRequest({ place, places, ...props }: PlanTripRequestProps) {
  const t = useTranslations("PlanTrip");
  const [plan, setPlan] = useState<PlanTripInput>(() => planTripDefaults(place));

  return (
    <LeadRequestCard<PlanTripValues>
      module="plan-trip"
      titleId="plan-trip-title"
      kicker={t("card.kicker")}
      title={t("card.title")}
      lead={t("card.lead")}
      secondStepLabel={t("step")}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={async (contact, values, page) =>
        (await import("@/lib/leads/planTripLeadForm")).buildPlanTripLead({
          contact,
          plan: values,
          notSureLabel: t("notSure"),
          page,
        })
      }
      renderSecondStep={({ sending, goBack, submit }) => (
        <PlanStep
          defaultValues={plan}
          places={places}
          consentText={props.consentText}
          sending={sending}
          onBack={(values) => {
            setPlan(values);
            goBack();
          }}
          onSubmit={(values) => {
            setPlan(values);
            submit(values);
          }}
        />
      )}
      success={{
        title: t("success.title"),
        lead: t("success.lead"),
        steps: [
          { title: t("success.step1Title"), body: t("success.step1Body") },
          { title: t("success.step2Title"), body: t("success.step2Body") },
          { title: t("success.step3Title"), body: t("success.step3Body") },
        ],
        whatsappMessage: (reference) => t("success.whatsappMessage", { reference }),
        againHref: "/tour-packages",
        againLabel: t("success.again"),
      }}
    />
  );
}

export { PlanTripRequest };
