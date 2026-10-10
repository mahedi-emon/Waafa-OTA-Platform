"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HotelSearch } from "@waafa/shared";
import { LeadRequestCard } from "@/components/leads/LeadRequestCard";
import { useDhakaToday } from "@/components/search/useDhakaToday";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import {
  buildHotelLead,
  stayDefaults,
  type StayStepInput,
  type StayStepValues,
} from "@/lib/leads/hotelLeadForm";
import { StayStep } from "./StayStep";

type HotelRequestProps = {
  search: HotelSearch | null;
  nationalities: Array<{ code: string; name: string }>;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  consentText: string;
  phoneDisplay: string;
  whatsappE164: string;
};

type Preferences = { seaView: boolean; freeCancellation: boolean };
const NONE: Preferences = { seaView: false, freeCancellation: false };

/** Hotels Manual mode (FR-HTL): sea view and free cancellation preferences beside the shared two-step request. */
function HotelRequest(props: HotelRequestProps) {
  const t = useTranslations("Hotels");
  const tLeads = useTranslations("Leads");
  const today = useDhakaToday();
  const [preferences, setPreferences] = useState<Preferences>(NONE);
  const [stay, setStay] = useState<StayStepInput>(() => stayDefaults(props.search));
  const count = Number(preferences.seaView) + Number(preferences.freeCancellation);

  const panel = (
    <div className="flex flex-col gap-4">
      {(
        [
          ["seaView", "seaViewSub"],
          ["freeCancellation", "freeCancellationSub"],
        ] as const
      ).map(([key, sub]) => (
        <label key={key} className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-[14.5px] font-semibold text-navy-900">
              {t(`prefs.${key}`)}
            </span>
            <span className="block text-[13px] text-mist-600">{t(`prefs.${sub}`)}</span>
          </span>
          <Switch
            checked={preferences[key]}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({ ...current, [key]: checked }))
            }
          />
        </label>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[264px_minmax(0,1fr)] xl:gap-8">
      <aside aria-labelledby="hotel-prefs-title" className="hidden xl:block">
        <h2 id="hotel-prefs-title" className="font-display text-[17px] font-bold text-navy-900">
          {t("prefs.title")}
        </h2>
        <p className="mt-1 mb-5 text-[13.5px] text-mist-600">{t("prefs.lead")}</p>
        {panel}
      </aside>
      <div className="flex min-w-0 flex-col gap-4">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="secondary" className="self-start xl:hidden">
              <SlidersHorizontal aria-hidden="true" />
              {t("prefs.open")} {tLeads("prefs.count", { count })}
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
            <div className="px-4 pb-4">{panel}</div>
            <div className="flex gap-3 border-t border-mist-200 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
              <Button variant="ghost" onClick={() => setPreferences(NONE)}>
                {tLeads("prefs.clear")}
              </Button>
              <DrawerClose asChild>
                <Button className="flex-1">{tLeads("prefs.save")}</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        <LeadRequestCard<StayStepValues>
          titleId="hotel-request-title"
          kicker={t("card.kicker")}
          title={t("card.title")}
          lead={t("card.lead")}
          secondStepLabel={t("steps.stay")}
          countries={props.countries}
          emailRequired={props.emailRequired}
          phoneDisplay={props.phoneDisplay}
          whatsappE164={props.whatsappE164}
          buildLead={(contact, values, page) =>
            buildHotelLead({ contact, stay: values, search: props.search, preferences, page })
          }
          renderSecondStep={({ sending, goBack, submit }) => (
            <StayStep
              defaultValues={stay}
              nationalities={props.nationalities}
              consentText={props.consentText}
              today={today}
              sending={sending}
              onBack={(values) => {
                setStay(values);
                goBack();
              }}
              onSubmit={(values) => {
                setStay(values);
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
            againHref: "/hotels",
          }}
        />
      </div>
    </div>
  );
}

export { HotelRequest };
