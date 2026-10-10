import { Plane } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatDate, formatDayMonth, formatTaka, type GroupFare } from "@waafa/shared";
import { Link } from "@/i18n/navigation";

type GroupFareCardProps = { fare: GroupFare };

/**
 * Group fare as a boarding pass (DESIGN.md "Cards"): big IATA codes joined by a dashed path, a stub with the
 * price and Request. Fares are indicative and confirmed before payment (PRD compliance).
 */
async function GroupFareCard({ fare }: GroupFareCardProps) {
  const t = await getTranslations("Home.groupFares");
  const dates = fare.returnDate
    ? `${formatDayMonth(fare.departDate)} – ${formatDayMonth(fare.returnDate)}`
    : formatDate(fare.departDate);

  return (
    <article className="group/fare relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="grid h-8 min-w-10 place-items-center rounded-md bg-navy-900 px-1.5 font-display text-[12px] font-extrabold tracking-wider text-white">
          {fare.airline.code}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink-900">{fare.airline.name}</p>
          <p className="truncate text-[12.5px] text-mist-600">
            {fare.baggage} · {fare.tripType === "return" ? t("return") : t("oneWay")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 pt-4 pb-3">
        <div>
          <p className="font-display text-[28px] leading-none font-extrabold text-navy-900">
            {fare.from.iata}
          </p>
          <p className="mt-1 text-[12.5px] text-mist-600">{fare.from.city}</p>
        </div>
        <div className="relative flex flex-col items-center gap-1 text-mist-500">
          <span aria-hidden="true" className="w-full border-t border-dashed border-mist-300" />
          <Plane
            aria-hidden="true"
            className="absolute top-[-9px] size-[18px] rotate-45 bg-white text-electric-600"
          />
          <span className="text-[12px]">
            {fare.stops === 0 ? t("direct") : t("stops", { count: fare.stops })}
          </span>
        </div>
        <div className="text-right">
          <p className="font-display text-[28px] leading-none font-extrabold text-navy-900">
            {fare.to.iata}
          </p>
          <p className="mt-1 text-[12.5px] text-mist-600">{fare.to.city}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4 text-[13px]">
        <span className="font-medium text-ink-900 tabular-nums">{dates}</span>
        {fare.seatsLeft !== undefined ? (
          <span className="rounded-full bg-warning-50 px-2 py-0.5 font-semibold text-warning-700">
            {t("seatsLeft", { count: fare.seatsLeft })}
          </span>
        ) : null}
      </div>

      {/* Stub: notches on the tear line, price and the one action. */}
      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-dashed border-mist-300 bg-mist-25 px-4 py-3">
        <span
          aria-hidden="true"
          className="absolute top-[-9px] -left-[9px] size-[18px] rounded-full border border-mist-200 bg-mist-50"
        />
        <span
          aria-hidden="true"
          className="absolute top-[-9px] -right-[9px] size-[18px] rounded-full border border-mist-200 bg-mist-50"
        />
        <p className="min-w-0">
          <span className="block text-[12px] text-mist-600">{t("from")}</span>
          <span className="font-display text-[20px] font-extrabold text-navy-900 tabular-nums">
            {formatTaka(fare.farePerAdult)}
          </span>{" "}
          <span className="text-[12.5px] text-mist-600">{t("perAdult")}</span>
        </p>
        <Link
          href={`/flights/group-fares?fare=${fare.id}`}
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-primary px-5 text-[14.5px] font-semibold text-primary-foreground outline-none hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {t("request")}
          <span className="sr-only">
            {" "}
            {fare.from.city} – {fare.to.city}, {dates}
          </span>
        </Link>
      </div>
    </article>
  );
}

export { GroupFareCard };
