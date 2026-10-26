"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { TourPackage } from "@waafa/shared";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PackageQueryValues } from "@/lib/leads/packageLeadForm";
import { usePackageBooking } from "./usePackageBooking";

/** Step 2 and its validation load when the visitor reaches it, not with the page (issues 170 and 236). */
const QueryStep = dynamic(() => import("./QueryStep").then((mod) => mod.QueryStep), {
  loading: () => <Skeleton className="mx-5 my-6 h-[520px] rounded-2xl md:mx-7" />,
});

type PackageQueryProps = {
  pkg: Pick<TourPackage, "id" | "title" | "prices">;
  departures: Array<{ value: string; label: string }>;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

/** "Send query" on a package (FR-PKG-06): the shared two-step request with a PKG reference. */
function PackageQuery({ pkg, departures, ...props }: PackageQueryProps) {
  const t = useTranslations("Packages");
  const { query, revision, saveQuery } = usePackageBooking();
  const sharings = pkg.prices.map((price) => ({
    value: price.sharing,
    label: `${price.label} · ${price.detail}`,
  }));

  return (
    <LeadRequestCard<PackageQueryValues>
      titleId="package-query-title"
      kicker={t("query.kicker")}
      title={t("query.title")}
      lead={t("query.lead")}
      secondStepLabel={t("query.step")}
      countries={props.countries}
      emailRequired={props.emailRequired}
      phoneDisplay={props.phoneDisplay}
      whatsappE164={props.whatsappE164}
      buildLead={async (contact, values, page) =>
        (await import("@/lib/leads/packageLeadForm")).buildPackageLead({
          contact,
          query: values,
          pkg,
          page,
        })
      }
      renderSecondStep={({ sending, goBack, submit }) => (
        <QueryStep
          key={revision}
          defaultValues={query}
          departures={departures}
          sharings={sharings}
          consentText={props.consentText}
          sending={sending}
          onBack={(values) => {
            saveQuery(values);
            goBack();
          }}
          onSubmit={(values) => {
            saveQuery(values);
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

export { PackageQuery };
