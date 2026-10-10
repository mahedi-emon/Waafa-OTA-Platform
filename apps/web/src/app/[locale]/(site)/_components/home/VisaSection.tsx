import { getTranslations } from "next-intl/server";
import type { HomeSection } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { VisaCountryCard } from "@/components/visa/VisaCountryCard";
import { listVisaCountries } from "@/lib/data/visa";
import { HomeSectionShell } from "./HomeSectionShell";

/** Visa services (FR-HOME 7): up to eight countries with processing time and our fee; embassies decide. */
async function VisaSection({ section }: { section: HomeSection }) {
  const [all, t, tHome] = await Promise.all([
    listVisaCountries(),
    getTranslations("Home.visa"),
    getTranslations("Home"),
  ]);
  const countries = all.slice(0, 8);
  if (countries.length === 0) return null;

  return (
    <HomeSectionShell labelledBy="home-visa">
      <SectionHeading
        id="home-visa"
        kicker={section.kicker}
        title={section.title || tHome("defaults.visa")}
        subtitle={section.subtitle}
        action={{ href: "/visa-services", label: t("all") }}
        aside={
          countries.some((c) => c.sample) ? (
            <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
          ) : null
        }
      />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {countries.map((country) => (
          <li key={country.id}>
            <VisaCountryCard country={country} />
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-mist-600">{t("note")}</p>
    </HomeSectionShell>
  );
}

export { VisaSection };
