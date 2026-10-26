"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { FlightPreferences, FlightSearch, OpeningHours } from "@waafa/shared";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { useDhakaToday } from "@/components/search/useDhakaToday";
import { PreferencesSheet } from "@/components/leads/PreferencesSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { TripStepInput, TripStepValues } from "@/lib/leads/flightLeadForm";
import { tripDefaults } from "@/lib/leads/flightTrip";
import { PreferencesPanel } from "./PreferencesPanel";

/** Step 2 and its validation load when the visitor reaches it, not with the page (issue 170). */
const TripStep = dynamic(() => import("./TripStep").then((mod) => mod.TripStep), {
  loading: () => <Skeleton className="mx-5 my-6 h-[520px] rounded-2xl md:mx-7" />,
});

export type GroupFareSummary = {
  id: string;
  title: string;
  meta: string;
  price: string;
  date: string;
};

type FlightRequestProps = {
  search: FlightSearch | null;
  /** Parts of a search a link carried when it was not a full search, e.g. only the destination. */
  prefill?: { from?: string; to?: string; depart?: string };
  groupFare: GroupFareSummary | null;
  airports: Array<{ iata: string; city: string }>;
  airlines: Array<{ code: string; name: string }>;
  /** The short list shown in the preferences rail (featured airlines). */
  preferenceAirlines: Array<{ code: string; name: string }>;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
  officeHours: OpeningHours;
};

const NO_PREFERENCES: FlightPreferences = {
  stops: "any",
  times: [],
  airlines: [],
  bag: "any",
  refundableOnly: false,
};

/**
 * Flights Manual mode (FR-FLT-02 to FR-FLT-06): the preferences rail (a sheet below 1280 px) beside the shared
 * two-step request, whose second step is the trip prefilled from the URL or the group fare.
 */
function FlightRequest(props: FlightRequestProps) {
  const t = useTranslations("Flights");
  const tLeads = useTranslations("Leads");
  const today = useDhakaToday();
  const [preferences, setPreferences] = useState<FlightPreferences>(NO_PREFERENCES);
  const [trip, setTrip] = useState<TripStepInput>(() =>
    tripDefaults(props.search, props.groupFare?.date, props.prefill),
  );
  const prefCount =
    (preferences.stops !== "any" ? 1 : 0) +
    preferences.times.length +
    preferences.airlines.length +
    (preferences.bag !== "any" ? 1 : 0) +
    (preferences.refundableOnly ? 1 : 0);
  const preferencesPanel = (
    <PreferencesPanel
      value={preferences}
      onChange={setPreferences}
      airlines={props.preferenceAirlines}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[264px_minmax(0,1fr)] xl:gap-8">
      <aside aria-labelledby="flight-prefs-title" className="hidden xl:block">
        <h2 id="flight-prefs-title" className="font-display text-[17px] font-bold text-navy-900">
          {t("prefs.title")}
        </h2>
        <p className="mt-1 mb-5 text-[13.5px] text-mist-600">{t("prefs.lead")}</p>
        {preferencesPanel}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <PreferencesSheet
          trigger={
            prefCount > 0
              ? `${t("prefs.open")} ${tLeads("prefs.count", { count: prefCount })}`
              : t("prefs.open")
          }
          labels={{
            title: t("prefs.title"),
            lead: t("prefs.lead"),
            clear: tLeads("prefs.clear"),
            save: tLeads("prefs.save"),
          }}
          onClear={() => setPreferences(NO_PREFERENCES)}
        >
          {preferencesPanel}
        </PreferencesSheet>

        <LeadRequestCard<TripStepValues>
          titleId="flight-request-title"
          kicker={t("card.kicker")}
          title={t("card.title")}
          lead={t("card.lead")}
          banner={
            props.groupFare ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist-200 bg-electric-50 px-5 py-3 md:px-7">
                <p className="min-w-0">
                  <span className="mr-2 rounded-[7px] bg-navy-900 px-2 py-0.5 text-[12px] font-semibold text-white">
                    {t("groupFare.label")}
                  </span>
                  <span className="text-[14px] font-semibold text-navy-900">
                    {props.groupFare.title}
                  </span>
                  <span className="block text-[13px] text-mist-700">
                    {props.groupFare.meta} ·{" "}
                    <span className="font-semibold tabular-nums">{props.groupFare.price}</span>
                  </span>
                </p>
                <Link
                  href="/flights/group-fares"
                  className="text-[14px] font-semibold text-brand-700 hover:underline"
                >
                  {t("groupFare.change")}
                </Link>
              </div>
            ) : null
          }
          secondStepLabel={t("steps.trip")}
          countries={props.countries}
          emailRequired={props.emailRequired}
          phoneDisplay={props.phoneDisplay}
          whatsappE164={props.whatsappE164}
          buildLead={async (contact, values, page) => {
            const { buildFlightLead } = await import("@/lib/leads/flightLeadForm");
            return buildFlightLead({
              contact,
              trip: values,
              search: props.search,
              preferences,
              ...(props.groupFare ? { groupFareId: props.groupFare.id } : {}),
              page,
            });
          }}
          renderSecondStep={({ sending, goBack, submit }) => (
            <TripStep
              defaultValues={trip}
              airports={props.airports}
              airlines={props.airlines}
              consentText={props.consentText}
              fixedDate={Boolean(props.groupFare)}
              today={today}
              sending={sending}
              onBack={(values) => {
                setTrip(values);
                goBack();
              }}
              onSubmit={(values) => {
                setTrip(values);
                submit(values);
              }}
            />
          )}
          success={{
            title: t("success.title"),
            lead: t("success.lead"),
            steps: [
              {
                title: t("success.step1Title"),
                body: (
                  <span className="flex flex-wrap items-center gap-2">
                    <OfficeStatusChip
                      hours={props.officeHours}
                      pendingLabel={t("success.step1Title")}
                    />
                    {t("success.step1Open")}
                  </span>
                ),
              },
              {
                title: t("success.step2Title"),
                body: t("success.step2Body", { phone: props.phoneDisplay }),
              },
              { title: t("success.step3Title"), body: t("success.step3Body") },
            ],
            whatsappMessage: (reference) => t("success.whatsappMessage", { reference }),
            againHref: "/flights",
          }}
        />
      </div>
    </div>
  );
}

export { FlightRequest };
