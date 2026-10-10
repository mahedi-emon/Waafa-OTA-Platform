"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { CounterRow } from "./CounterRow";
import { PickerFooter } from "./PickerFooter";
import { useSearchCard } from "./SearchCardContext";

type PartyPickerProps = { kind: "tour" | "visa" };

/** Tour travellers or visa applicants: steppers with one helpful note. */
function PartyPicker({ kind }: PartyPickerProps) {
  const t = useTranslations("Search");
  const { state } = useSearchCard();
  const { tour, visa } = state;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {kind === "tour" ? (
          <div className="divide-y divide-mist-200">
            <CounterRow
              field="tourAdults"
              title={t("counters.adults")}
              sub={t("counters.adultsSub")}
            />
            <CounterRow
              field="tourChildren"
              title={t("counters.children")}
              sub={t("counters.hotelChildrenSub")}
            />
          </div>
        ) : (
          <CounterRow
            field="applicants"
            title={t("counters.applicants")}
            sub={t("counters.applicantsSub")}
          />
        )}
        <p className="mt-2 flex gap-2 rounded-xl bg-mist-50 p-3 text-[13.5px] leading-relaxed text-mist-700">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
          {t(kind === "tour" ? "counters.tourNote" : "counters.visaNote")}
        </p>
      </div>
      <PickerFooter
        summary={
          kind === "tour"
            ? t("values.travellers", { count: tour.adults + tour.children })
            : t("values.applicants", { count: visa.applicants })
        }
        detail={kind === "tour" ? t("values.tourKind") : t("values.passport")}
      />
    </>
  );
}

export { PartyPicker };
