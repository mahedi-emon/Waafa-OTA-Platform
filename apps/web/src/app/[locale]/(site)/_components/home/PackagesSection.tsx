import { getTranslations } from "next-intl/server";
import type { HomeSection } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { PackageCard } from "@/components/travel/PackageCard";
import { listPackages } from "@/lib/data/travel";
import { HomeSectionShell } from "./HomeSectionShell";
import { SnapRow } from "./SnapRow";

/** Featured tour packages (FR-HOME 6): the four most popular, a snap row on phones. */
async function PackagesSection({ section }: { section: HomeSection }) {
  const [page, t, tHome] = await Promise.all([
    listPackages({ sort: "popular", limit: 4 }),
    getTranslations("Home.packages"),
    getTranslations("Home"),
  ]);
  const packages = page.items;
  if (packages.length === 0) return null;

  return (
    <HomeSectionShell labelledBy="home-packages" tone="mist">
      <SectionHeading
        id="home-packages"
        kicker={section.kicker}
        title={section.title || tHome("defaults.packages")}
        subtitle={section.subtitle}
        action={{ href: "/tour-packages", label: t("all") }}
        aside={
          packages.some((p) => p.sample) ? (
            <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
          ) : null
        }
      />
      <SnapRow className="lg:grid-cols-2 xl:grid-cols-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </SnapRow>
    </HomeSectionShell>
  );
}

export { PackagesSection };
