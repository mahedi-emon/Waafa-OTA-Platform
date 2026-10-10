"use client";

import { useTranslations } from "next-intl";
import { CountryCode } from "./CountryCode";
import { PickerAnchor } from "./PickerAnchor";
import { anchorFieldId, useSearchCard } from "./SearchCardContext";
import { SearchField } from "./SearchField";
import { SearchSubmit } from "./SearchSubmit";

type VisaPanelProps = { pending: boolean };

/** Visa (FR-SRCH-05): country, purpose and applicants; opens the country page with the requirements. */
function VisaPanel({ pending }: VisaPanelProps) {
  const t = useTranslations("Search");
  const { state, dispatch } = useSearchCard();
  const visa = state.visa;
  const active = (fieldId: string) =>
    state.picker !== null && anchorFieldId(state.picker, false) === fieldId;

  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:flex-1">
        <PickerAnchor fieldId="country" className="col-span-2 md:col-span-1">
          <SearchField
            fieldId="country"
            label={t("fields.visaFor")}
            value={visa.country ? visa.country.name : t("empty.country")}
            sub={t("values.passport")}
            empty={!visa.country}
            leading={visa.country ? <CountryCode code={visa.country.flagCode} /> : undefined}
            active={active("country")}
            onOpen={() => dispatch({ type: "open", key: "country" })}
          />
        </PickerAnchor>
        <PickerAnchor fieldId="visaType">
          <SearchField
            fieldId="visaType"
            label={t("fields.visaType")}
            value={t(`visaTypes.${visa.type}.label`)}
            sub={t(`visaTypes.${visa.type}.description`)}
            active={active("visaType")}
            onOpen={() => dispatch({ type: "open", key: "visaType" })}
          />
        </PickerAnchor>
        <PickerAnchor fieldId="applicants">
          <SearchField
            fieldId="applicants"
            label={t("fields.applicants")}
            value={t("values.applicants", { count: visa.applicants })}
            sub={t("values.ownPassport")}
            active={active("applicants")}
            onOpen={() => dispatch({ type: "open", key: "applicants" })}
          />
        </PickerAnchor>
      </div>
      <SearchSubmit pending={pending} />
    </div>
  );
}

export { VisaPanel };
