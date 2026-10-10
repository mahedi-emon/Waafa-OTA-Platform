import { getTranslations } from "next-intl/server";
import type { HomeSection } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { listBanners } from "@/lib/data/content";
import { HomeSectionShell } from "./HomeSectionShell";
import { OfferCard } from "./OfferCard";
import { SnapRow } from "./SnapRow";

/** Offers (FR-HOME 3): admin banners for the home placement, a snap row on phones and a grid on desktop. */
async function OffersSection({ section }: { section: HomeSection }) {
  const [offers, t] = await Promise.all([listBanners("home-offers"), getTranslations("Home")]);
  if (offers.length === 0) return null;

  return (
    <HomeSectionShell labelledBy="home-offers">
      <SectionHeading
        id="home-offers"
        kicker={section.kicker}
        title={section.title || t("defaults.offers")}
        subtitle={section.subtitle}
        aside={
          offers.some((o) => o.sample) ? (
            <SampleBadge label={t("sample")} title={t("sampleNote")} />
          ) : null
        }
      />
      <SnapRow className="lg:grid-cols-3">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} viewLabel={t("offers.view")} />
        ))}
      </SnapRow>
    </HomeSectionShell>
  );
}

export { OffersSection };
