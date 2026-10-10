import { getTranslations } from "next-intl/server";
import type { HomeSection } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { Marquee } from "@/components/motion/Marquee";
import { GroupFareCard } from "@/components/travel/GroupFareCard";
import { listFeaturedAirlines, listGroupFares } from "@/lib/data/travel";
import { HomeSectionShell } from "./HomeSectionShell";
import { SnapRow } from "./SnapRow";

/** Group fares (FR-HOME 4, FR-FLT-07): fixed-date seats as boarding passes, then the airlines we book. */
async function GroupFaresSection({ section }: { section: HomeSection }) {
  const [page, airlines, t, tHome] = await Promise.all([
    listGroupFares(),
    listFeaturedAirlines(),
    getTranslations("Home.groupFares"),
    getTranslations("Home"),
  ]);
  const fares = page.slice(0, 4);
  if (fares.length === 0) return null;

  return (
    <HomeSectionShell labelledBy="home-group-fares" tone="mist">
      <SectionHeading
        id="home-group-fares"
        kicker={section.kicker}
        title={section.title || tHome("defaults.groupFares")}
        subtitle={section.subtitle}
        action={{ href: "/flights/group-fares", label: t("all") }}
        aside={
          fares.some((f) => f.sample) ? (
            <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
          ) : null
        }
      />
      <SnapRow className="lg:grid-cols-2 xl:grid-cols-4">
        {fares.map((fare) => (
          <GroupFareCard key={fare.id} fare={fare} />
        ))}
      </SnapRow>
      <p className="text-[13px] text-mist-600">{t("indicative")}</p>
      {airlines.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-mist-200 pt-6">
          <p className="text-[13.5px] font-semibold text-mist-700">{t("airlinesLead")}</p>
          <Marquee label={t("airlinesLabel")}>
            {airlines.map((airline) => (
              <span
                key={airline.code}
                className="mx-2 inline-flex h-11 items-center gap-2 rounded-full border border-mist-200 bg-white px-4 text-[14px] font-medium whitespace-nowrap text-ink-900"
              >
                <span className="font-display text-[12px] font-extrabold tracking-wider text-brand-700">
                  {airline.code}
                </span>
                {airline.name}
              </span>
            ))}
          </Marquee>
        </div>
      ) : null}
    </HomeSectionShell>
  );
}

export { GroupFaresSection };
