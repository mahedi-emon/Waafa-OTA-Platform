"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import {
  buildPlanTripLead,
  planTripDefaults,
  type PlanTripInput,
  type PlanTripValues,
} from "@/lib/leads/planTripLeadForm";
import { PlanStep } from "./PlanStep";

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
      titleId="plan-trip-title"
      kicker={t("card.kicker")}
      title={t("card.title")}
      lead={t("card.lead")}
      secondStepLabel={t("step")}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={(contact, values, page) =>
        buildPlanTripLead({ contact, plan: values, notSureLabel: t("notSure"), page })
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
