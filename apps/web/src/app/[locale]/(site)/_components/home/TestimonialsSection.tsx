import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { HomeSection } from "@waafa/shared";
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
            <p
              className="flex gap-0.5"
              aria-label={t("rating", { rating: item.rating })}
              role="img"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  aria-hidden="true"
                  className={
                    i < item.rating
                      ? "size-4 fill-electric-600 text-electric-600"
                      : "size-4 text-mist-300"
                  }
                />
              ))}
            </p>
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
