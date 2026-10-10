"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchCard } from "./SearchCardContext";

/** One reassurance line per tab: what happens after the search (Manual mode never shows live availability). */
function HelpLine() {
  const t = useTranslations("Search.help");
  const { state, data } = useSearchCard();
  const [lead, close] =
    state.tab === "flight"
      ? data.flightMode === "live"
        ? [t("flightLive", { phone: data.phoneDisplay }), null]
        : [t("flightManual"), t("noPayment")]
      : state.tab === "hotel"
        ? [t("hotel"), t("noPayment")]
        : state.tab === "tour"
          ? [t("tour"), t("freeToAsk")]
          : [t("visa"), t("embassies")];

  return (
    <p className="flex items-start gap-2 text-[13px] leading-snug text-mist-600">
      <ShieldCheck aria-hidden="true" className="mt-px size-4 shrink-0 text-success-600" />
      <span>
        {lead}
        {close ? <strong className="ml-1 font-semibold text-navy-900">{close}</strong> : null}
      </span>
    </p>
  );
}

export { HelpLine };
