import { getTranslations } from "next-intl/server";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { GroupFareCard } from "@/components/travel/GroupFareCard";
import { listGroupFares } from "@/lib/data/travel";

type GroupFaresRailProps = { to?: string; excludeId?: string };

/** "Group fares on this route" under the request (FR-FLT-07): fares to the searched city, else the next ones. */
async function GroupFaresRail({ to, excludeId }: GroupFaresRailProps) {
  const [onRoute, all, t, tHome] = await Promise.all([
    to ? listGroupFares({ to }) : Promise.resolve([]),
    listGroupFares(),
    getTranslations("Flights.groupRail"),
    getTranslations("Home"),
  ]);
  const fares = (onRoute.length > 0 ? onRoute : all)
    .filter((fare) => fare.id !== excludeId)
    .slice(0, 2);
  if (fares.length === 0) return null;

  return (
    <section aria-labelledby="group-rail-title" className="flex flex-col gap-4">
      <SectionHeading
        id="group-rail-title"
        title={t("title")}
        subtitle={t("lead")}
        action={{ href: "/flights/group-fares", label: t("all") }}
        aside={
          fares.some((f) => f.sample) ? (
            <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
          ) : null
        }
        className="[&_h2]:text-[20px] [&_h2]:md:text-[22px]"
      />
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fares.map((fare) => (
          <li key={fare.id}>
            <GroupFareCard fare={fare} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export { GroupFaresRail };
