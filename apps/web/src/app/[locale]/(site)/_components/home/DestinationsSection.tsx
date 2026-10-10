import { getTranslations } from "next-intl/server";
import { DestinationTagSchema, formatTaka, type HomeSection } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { DestinationCard } from "@/components/travel/DestinationCard";
import { listDestinations } from "@/lib/data/content";
import { DestinationFilter } from "./DestinationFilter";
import { HomeSectionShell } from "./HomeSectionShell";

/** Destination finder (FR-HOME 5): tiles with flight time, visa note and price, filtered by trip type. */
async function DestinationsSection({ section }: { section: HomeSection }) {
  const [destinations, t, tHome] = await Promise.all([
    listDestinations(),
    getTranslations("Home.destinations"),
    getTranslations("Home"),
  ]);
  if (destinations.length === 0) return null;
  const used = new Set(destinations.flatMap((d) => d.tags));
  const filters = [
    { value: "all", label: t("filters.all") },
    ...DestinationTagSchema.options
      .filter((tag) => used.has(tag))
      .map((tag) => ({ value: tag, label: t(`filters.${tag}`) })),
  ];

  return (
    <HomeSectionShell labelledBy="home-destinations">
      <SectionHeading
        id="home-destinations"
        kicker={section.kicker}
        title={section.title || tHome("defaults.destinations")}
        subtitle={section.subtitle}
        action={{ href: "/tour-packages", label: t("all") }}
        aside={
          destinations.some((d) => d.sample) ? (
            <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
          ) : null
        }
      />
      <DestinationFilter
        label={t("filterLabel")}
        filters={filters}
        emptyLabel={t("empty")}
        items={destinations.map((destination) => ({
          key: destination.id,
          tags: destination.tags,
          node: (
            <DestinationCard
              destination={destination}
              labels={{
                flight: t("flight", { time: destination.flightTime }),
                price: t("from", { price: formatTaka(destination.fromPrice) }),
              }}
            />
          ),
        }))}
      />
      <p className="text-[13px] text-mist-600">{t("note")}</p>
    </HomeSectionShell>
  );
}

export { DestinationsSection };
