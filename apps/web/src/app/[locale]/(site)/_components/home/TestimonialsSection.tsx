import { getTranslations } from "next-intl/server";
import type { HomeSection } from "@waafa/shared";
import { RatingStars } from "@/components/content/RatingStars";
import { SectionHeading } from "@/components/content/SectionHeading";
import { listPublicFeedback } from "@/lib/data/content";
import { HomeSectionShell } from "./HomeSectionShell";
import { SnapRow } from "./SnapRow";

/**
 * Testimonials (FR-HOME 10): approved feedback with the traveller's consent only, never invented. Hidden when there
 * is none; the gallery section then carries the Facebook reviews link and the Leave feedback card.
 */
async function TestimonialsSection({ section }: { section: HomeSection }) {
  const [feedback, t, tHome] = await Promise.all([
    listPublicFeedback(),
    getTranslations("Home.reviews"),
    getTranslations("Home"),
  ]);
  if (feedback.length === 0) return null;

  return (
    <HomeSectionShell labelledBy="home-testimonials" tone="mist">
      <SectionHeading
        id="home-testimonials"
        kicker={section.kicker}
        title={section.title || tHome("defaults.testimonials")}
        subtitle={section.subtitle}
        action={{ href: "/feedback", label: t("feedback") }}
      />
      <SnapRow
        className="lg:grid-cols-3"
        scrollLabel={section.title || tHome("defaults.testimonials")}
      >
        {feedback.slice(0, 6).map((item) => (
          <figure
            key={item.id}
            className="flex h-full flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
          >
            {item.rating ? (
              <RatingStars rating={item.rating} label={t("rating", { rating: item.rating })} />
            ) : null}
            <blockquote className="text-[15px] leading-relaxed text-ink-900">
              {item.comment}
            </blockquote>
            <figcaption className="mt-auto text-[13.5px] font-semibold text-navy-900">
              {item.name}
            </figcaption>
          </figure>
        ))}
      </SnapRow>
    </HomeSectionShell>
  );
}

export { TestimonialsSection };
