"use client";

import { useRef, useState } from "react";
import { CircleAlert, Home, Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import {
  whatsappLink,
  type FlightPreferences,
  type FlightSearch,
  type LeadCreated,
  type OpeningHours,
} from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { LeadSuccess } from "@/components/leads/LeadSuccess";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Link } from "@/i18n/navigation";
import {
  buildFlightLead,
  tripDefaults,
  type ContactStepValues,
  type TripStepInput,
  type TripStepValues,
} from "@/lib/leads/flightLeadForm";
import { useDhakaToday } from "@/components/search/useDhakaToday";
import { ContactStep } from "./ContactStep";
import { PreferencesPanel } from "./PreferencesPanel";
import { TripStep } from "./TripStep";

export type GroupFareSummary = {
  id: string;
  title: string;
  meta: string;
  price: string;
  date: string;
};

type FlightRequestProps = {
  search: FlightSearch | null;
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

type Phase = "contact" | "trip" | "sent";

/**
 * Flights Manual mode (FR-FLT-02 to FR-FLT-06): preferences rail, a two-step request and the boarding-pass success.
 * One idempotency key per request, so a double tap or a retry makes one lead.
 */
function FlightRequest(props: FlightRequestProps) {
  const t = useTranslations("Flights");
  const today = useDhakaToday();
  const [phase, setPhase] = useState<Phase>("contact");
  const [preferences, setPreferences] = useState<FlightPreferences>(NO_PREFERENCES);
  const [contact, setContact] = useState<ContactStepValues>({
    name: "",
    phoneCountry: props.countries[0]?.code ?? "BD",
    phone: "",
    email: "",
  });
  const [trip, setTrip] = useState<TripStepInput>(() =>
    tripDefaults(props.search, props.groupFare?.date),
  );
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<"retry" | "rate" | null>(null);
  const [created, setCreated] = useState<LeadCreated | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const prefCount =
    (preferences.stops !== "any" ? 1 : 0) +
    preferences.times.length +
    preferences.airlines.length +
    (preferences.bag !== "any" ? 1 : 0) +
    (preferences.refundableOnly ? 1 : 0);

  const goTo = (next: Phase) => {
    setPhase(next);
    window.requestAnimationFrame(() =>
      card.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  const submit = async (values: TripStepValues) => {
    if (sending) return;
    setTrip(values);
    setSending(true);
    setFailure(null);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const lead = buildFlightLead({
        contact,
        trip: values,
        search: props.search,
        preferences,
        ...(props.groupFare ? { groupFareId: props.groupFare.id } : {}),
        page: window.location.pathname,
      });
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: idempotencyKey.current, lead }),
      });
      if (!response.ok) {
        setFailure(response.status === 429 ? "rate" : "retry");
        return;
      }
      setCreated((await response.json()) as LeadCreated);
      idempotencyKey.current = null;
      goTo("sent");
    } catch {
      setFailure("retry");
    } finally {
      setSending(false);
    }
  };

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
        {phase !== "sent" ? (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" className="self-start xl:hidden">
                <SlidersHorizontal aria-hidden="true" />
                {t("prefs.open")} {t("prefs.count", { count: prefCount })}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90dvh] rounded-t-[28px] border-0 bg-white">
              <div className="px-4 pt-2 pb-2">
                <DrawerTitle className="font-display text-[18px] font-bold text-navy-900">
                  {t("prefs.title")}
                </DrawerTitle>
                <DrawerDescription className="text-[13.5px] text-mist-600">
                  {t("prefs.lead")}
                </DrawerDescription>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{preferencesPanel}</div>
              <div className="flex gap-3 border-t border-mist-200 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
                <Button variant="ghost" onClick={() => setPreferences(NO_PREFERENCES)}>
                  {t("prefs.clear")}
                </Button>
                <DrawerClose asChild>
                  <Button className="flex-1">{t("prefs.save")}</Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        ) : null}

        <div ref={card} className="scroll-mt-28">
          {phase === "sent" && created ? (
            <LeadSuccess
              title={t("success.title")}
              lead={t("success.lead")}
              reference={created.reference}
              labels={{
                reference: t("success.reference"),
                copy: t("success.copy"),
                copied: t("success.copied"),
                copyFailed: t("success.copyFailed"),
              }}
              steps={[
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
              ]}
              actions={
                <>
                  <Button asChild variant="whatsapp">
                    <a
                      href={whatsappLink(
                        props.whatsappE164,
                        t("success.whatsappMessage", { reference: created.reference }),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon />
                      {t("success.whatsapp")}
                    </a>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/flights">
                      <Search aria-hidden="true" />
                      {t("success.again")}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/">
                      <Home aria-hidden="true" />
                      {t("success.home")}
                    </Link>
                  </Button>
                </>
              }
              footnote={contact.email ? t("success.emailCopy") : undefined}
            />
          ) : (
            <section
              aria-labelledby="flight-request-title"
              className="overflow-hidden rounded-[20px] border border-mist-200 bg-white shadow-sm"
            >
              <header className="flex flex-col gap-1.5 border-b border-mist-200 bg-mist-25 px-5 py-5 md:px-7">
                <p className="type-label text-brand-700">{t("card.kicker")}</p>
                <h2
                  id="flight-request-title"
                  className="font-display text-[22px] leading-tight font-bold text-navy-900"
                >
                  {t("card.title")}
                </h2>
                <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-mist-600">
                  {t("card.lead")}
                </p>
              </header>

              {props.groupFare ? (
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
              ) : null}

              <ol aria-label={t("steps.label")} className="flex gap-2 px-5 pt-5 md:px-7">
                {(["contact", "trip"] as const).map((step, index) => {
                  const current = phase === step;
                  const done = step === "contact" && phase === "trip";
                  return (
                    <li
                      key={step}
                      aria-current={current ? "step" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold",
                        current
                          ? "bg-navy-900 text-white"
                          : done
                            ? "bg-success-50 text-success-600"
                            : "bg-mist-100 text-mist-600",
                      )}
                    >
                      <span className="grid size-5 place-items-center rounded-full bg-white/20 tabular-nums">
                        {index + 1}
                      </span>
                      {t(`steps.${step}`)}
                    </li>
                  );
                })}
              </ol>

              <div className="px-5 pt-5 pb-6 md:px-7">
                {failure ? (
                  <div
                    role="alert"
                    className="mb-5 flex gap-3 rounded-xl border border-danger-600/30 bg-danger-25 p-4"
                  >
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-danger-600"
                    />
                    <div>
                      <p className="text-[15px] font-semibold text-navy-900">
                        {t("failure.title")}
                      </p>
                      <p className="text-[14px] text-mist-700">
                        {failure === "rate"
                          ? t("failure.tooMany")
                          : t("failure.body", { phone: props.phoneDisplay })}
                      </p>
                    </div>
                  </div>
                ) : null}
                {phase === "contact" ? (
                  <ContactStep
                    defaultValues={contact}
                    emailRequired={props.emailRequired}
                    countries={props.countries}
                    onSubmit={(values) => {
                      setContact(values);
                      goTo("trip");
                    }}
                  />
                ) : (
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
                      goTo("contact");
                    }}
                    onSubmit={submit}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export { FlightRequest };
