import { ArrowRight, Plane } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatDate, formatTaka, type Airline, type GroupFare } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { CountryFlag } from "@/components/media/CountryFlag";
import { AirlineLogo } from "@/components/travel/AirlineLogo";
import { Link } from "@/i18n/navigation";

type HeroFareCardProps = {
  fare: GroupFare;
  /** The current airline record (it may carry a logo uploaded in Admin after the fare was made). */
  airline: Pick<Airline, "code" | "name" | "logo">;
  /** Country codes of both airports, for the flags. */
  fromCountry: string | null;
  toCountry: string | null;
};

/**
 * The next group fare on the hero media (issue 157), from 1024 px: a solid white boarding-pass card (glass stays on
 * the search card only) with the airline logo, route with flags, date, seats and the indicative price. Real data from
 * Travel › Group fares; the whole card links to the group fares page. It sits over the flight path's departure dot (65.1 %
 * down the panel, see FlightPath), so the route reads as leaving from this fare.
 */
async function HeroFareCard({ fare, airline, fromCountry, toCountry }: HeroFareCardProps) {
  const [t, tFares, tHome] = await Promise.all([
    getTranslations("Home.heroFare"),
    getTranslations("Home.groupFares"),
    getTranslations("Home"),
  ]);
  const date = formatDate(fare.departDate);
  const price = formatTaka(fare.farePerAdult);

  return (
    <Link
      href="/flights/group-fares"
      aria-label={t("label", {
        airline: airline.name,
        from: fare.from.city,
        to: fare.to.city,
        date,
        price,
      })}
      className="group/fare absolute bottom-[calc(34.9%-12px)] left-6 hidden w-[292px] flex-col gap-3 rounded-[20px] bg-white p-4 text-navy-900 shadow-[0_24px_48px_-24px_rgb(2_13_57/0.55)] ring-1 ring-white/70 transition-transform duration-200 ease-out outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40 lg:flex"
    >
      <div className="flex items-center gap-2.5">
        <AirlineLogo airline={airline} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t("kicker")}
          </p>
          <p className="truncate text-[13.5px] font-semibold">{airline.name}</p>
        </div>
        {fare.sample ? <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} /> : null}
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <div>
          <p className="font-display text-[24px] leading-none font-extrabold">{fare.from.iata}</p>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-mist-600">
            {fromCountry ? <CountryFlag code={fromCountry} size="xs" /> : null}
            {fare.from.city}
          </p>
        </div>
        <div className="relative flex items-center">
          <span aria-hidden="true" className="w-full border-t border-dashed border-mist-300" />
          <Plane
            aria-hidden="true"
            className="absolute left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white text-electric-600 transition-transform duration-300 ease-out group-hover/fare:translate-x-1"
          />
        </div>
        <div className="text-right">
          <p className="font-display text-[24px] leading-none font-extrabold">{fare.to.iata}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[12px] text-mist-600">
            {toCountry ? <CountryFlag code={toCountry} size="xs" /> : null}
            {fare.to.city}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-dashed border-mist-200 pt-3 text-[12.5px]">
        <span className="font-medium tabular-nums">{date}</span>
        {fare.seatsLeft !== undefined ? (
          <span className="rounded-full bg-warning-50 px-2 py-0.5 font-semibold text-warning-700">
            {tFares("seatsLeft", { count: fare.seatsLeft })}
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="leading-tight">
          <span className="block text-[11.5px] text-mist-600">{tFares("from")}</span>
          <span className="font-display text-[20px] font-extrabold tabular-nums">{price}</span>{" "}
          <span className="text-[12px] text-mist-600">{tFares("perAdult")}</span>
        </p>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
          {t("cta")}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-150 group-hover/fare:translate-x-0.5"
          />
        </span>
      </div>
      <p className="text-[11px] text-mist-600">{tFares("indicative")}</p>
    </Link>
  );
}

export { HeroFareCard };
