"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import {
  buildVisaLead,
  visaFileDefaults,
  type VisaFileInput,
  type VisaFileValues,
} from "@/lib/leads/visaLeadForm";
import { VisaFileStep, type VisaTypeOption } from "./VisaFileStep";

type VisaApplyRequestProps = {
  country: { slug: string; name: string };
  types: VisaTypeOption[];
  officeDays: number[];
  officeAddress: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** The visa type and applicants carried from the country page or the search card (`?type=&applicants=`). */
function initialChoice(types: VisaTypeOption[]): VisaFileInput {
  const params = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const type =
    types.find((option) => option.type === params?.get("type"))?.type ??
    types[0]?.type ??
    "tourist";
  const applicants = Number(params?.get("applicants")) || 1;
  return visaFileDefaults({ visaType: type, applicants });
}

/** Visa application (FR-VISA-03): the shared two-step request with a VSA reference. */
function VisaApplyRequest({
  country,
  types,
  officeDays,
  officeAddress,
  ...props
}: VisaApplyRequestProps) {
  const t = useTranslations("Visa");
  const [file, setFile] = useState<VisaFileInput | null>(null);

  return (
    <LeadRequestCard<VisaFileValues>
      titleId="visa-apply-title"
      kicker={t("apply.cardKicker")}
      title={t("apply.cardTitle")}
      lead={t("apply.cardLead")}
      secondStepLabel={t("apply.step")}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={(contact, values, page) => buildVisaLead({ contact, values, country, page })}
      renderSecondStep={({ sending, goBack, submit }) => (
        <VisaFileStep
          countryName={country.name}
          types={types}
          officeDays={officeDays}
          officeAddress={officeAddress}
          consentText={props.consentText}
          defaultValues={file ?? initialChoice(types)}
          sending={sending}
          onBack={(values) => {
            setFile(values);
            goBack();
          }}
          onSubmit={(values) => {
            setFile(values);
            submit(values);
          }}
        />
      )}
      success={{
        title: t("apply.success.title"),
        lead: t("apply.success.lead"),
        steps: [
          { title: t("apply.success.step1Title"), body: t("apply.success.step1Body") },
          { title: t("apply.success.step2Title"), body: t("apply.success.step2Body") },
          { title: t("apply.success.step3Title"), body: t("apply.success.step3Body") },
        ],
        whatsappMessage: (reference) => t("apply.success.whatsappMessage", { reference }),
        againHref: "/visa-services",
        againLabel: t("apply.success.again"),
      }}
    />
  );
}

export { VisaApplyRequest };
