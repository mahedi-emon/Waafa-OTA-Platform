import type { ReactNode } from "react";
import type { HomeSection } from "@waafa/shared";
import { SearchCard } from "@/components/search/SearchCard";
import { getMediaSlot } from "@/lib/data/content";
import { getHomeContent, getSiteSettings, listHomeSections } from "@/lib/data/settings";
import { CtaSection } from "./CtaSection";
import { DestinationsSection } from "./DestinationsSection";
import { GalleryBlogFaqSection } from "./GalleryBlogFaqSection";
import { GroupFaresSection } from "./GroupFaresSection";
import { HeroSection } from "./HeroSection";
import { OffersSection } from "./OffersSection";
import { PackagesSection } from "./PackagesSection";
import { StoreSection } from "./StoreSection";
import { TeamSection } from "./TeamSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { TrustSection } from "./TrustSection";
import { VisaSection } from "./VisaSection";
import { WhySection } from "./WhySection";

/**
 * The 13 home sections (PRD §7) in the order and visibility set in Content › Home; each section hides itself when
 * its data is empty.
 */
async function HomeSections() {
  const [sections, content, heroMedia, site] = await Promise.all([
    listHomeSections(),
    getHomeContent(),
    getMediaSlot("home-hero"),
    getSiteSettings(),
  ]);
  const heroShown = sections.some((section) => section.key === "hero");

  const render = (section: HomeSection): ReactNode => {
    switch (section.key) {
      case "hero":
        return (
          <HeroSection
            key={section.key}
            hero={content.hero}
            media={heroMedia}
            search={<SearchCard source="home" />}
          />
        );
      case "trust":
        return <TrustSection key={section.key} />;
      case "offers":
        return <OffersSection key={section.key} section={section} />;
      case "groupFares":
        return <GroupFaresSection key={section.key} section={section} />;
      case "destinations":
        return <DestinationsSection key={section.key} section={section} />;
      case "packages":
        return <PackagesSection key={section.key} section={section} />;
      case "visa":
        return <VisaSection key={section.key} section={section} />;
      case "why":
        return <WhySection key={section.key} section={section} why={content.why} />;
      case "store":
        return <StoreSection key={section.key} section={section} store={content.store} />;
      case "testimonials":
        return <TestimonialsSection key={section.key} section={section} />;
      case "galleryBlogFaq":
        return (
          <GalleryBlogFaqSection key={section.key} section={section} reviews={content.reviews} />
        );
      case "team":
        return <TeamSection key={section.key} section={section} />;
      case "cta":
        return <CtaSection key={section.key} cta={content.cta} />;
    }
  };

  return (
    <>
      {/* The hero carries the page h1; if an admin turns it off, Home still has one heading for its title. */}
      {heroShown ? null : <h1 className="sr-only">{site.travelBrand}</h1>}
      {sections.map(render)}
    </>
  );
}

export { HomeSections };
