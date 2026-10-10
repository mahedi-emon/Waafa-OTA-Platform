import { ArrowRight, MessageSquareHeart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { HomeContent, HomeSection } from "@waafa/shared";
import { BlogCard } from "@/components/content/BlogCard";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { SmartImage } from "@/components/media/SmartImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { listBlogCategories, listBlogPosts, listFaqs, listGalleryAlbums } from "@/lib/data/content";
import { getSiteSettings } from "@/lib/data/settings";
import { Link } from "@/i18n/navigation";
import { HomeSectionShell } from "./HomeSectionShell";
import { SnapRow } from "./SnapRow";

type GalleryBlogFaqSectionProps = { section: HomeSection; reviews: HomeContent["reviews"] };

/**
 * Gallery and reviews, travel guides and five FAQs (FR-HOME 11). Reviews link out to Facebook and to the feedback
 * form: nothing here is invented, and only approved, consented feedback is ever shown on the site.
 */
async function GalleryBlogFaqSection({ section, reviews }: GalleryBlogFaqSectionProps) {
  const [albums, posts, categories, faqs, site, t] = await Promise.all([
    listGalleryAlbums(),
    listBlogPosts({ limit: 3 }),
    listBlogCategories(),
    listFaqs({ onHome: true }),
    getSiteSettings(),
    getTranslations("Home"),
  ]);
  const photos = albums.slice(0, 3);
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name;

  return (
    <>
      {photos.length > 0 ? (
        <HomeSectionShell labelledBy="home-gallery">
          <SectionHeading
            id="home-gallery"
            kicker={section.kicker}
            title={section.title || t("defaults.galleryBlogFaq")}
            subtitle={section.subtitle}
            action={{ href: "/gallery", label: t("gallery.open") }}
            aside={
              photos.some((a) => a.sample) ? (
                <SampleBadge label={t("sample")} title={t("sampleNote")} />
              ) : null
            }
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {photos.map((album, index) => (
              <li
                key={album.id}
                className={index === 0 ? "col-span-2 row-span-2 md:col-span-2" : undefined}
              >
                <Link
                  href={`/gallery/${album.slug}`}
                  className="group relative block overflow-hidden rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <SmartImage
                    src={album.cover.src}
                    alt={album.cover.alt}
                    ratio="1/1"
                    sizes={
                      index === 0
                        ? "(min-width: 768px) 66vw, 100vw"
                        : "(min-width: 768px) 33vw, 50vw"
                    }
                    zoomOnHover
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-midnight-950/75 to-transparent p-3 text-[14px] font-semibold text-white">
                    {album.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {site.reviewsUrl ? (
              <a
                href={site.reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-2xl border border-mist-200 bg-white p-5 outline-none hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-electric-50 text-brand-700">
                  <FacebookIcon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[16px] font-bold text-navy-900">
                    {reviews.facebookTitle}
                  </span>
                  <span className="block text-[14px] text-mist-600">{reviews.facebookBody}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-700">
                    {t("reviews.facebook")}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </span>
              </a>
            ) : null}
            <Link
              href="/feedback"
              className="group flex items-start gap-4 rounded-2xl border border-mist-200 bg-white p-5 outline-none hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-electric-50 text-brand-700">
                <MessageSquareHeart aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[16px] font-bold text-navy-900">
                  {reviews.feedbackTitle}
                </span>
                <span className="block text-[14px] text-mist-600">{reviews.feedbackBody}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-700">
                  {t("reviews.feedback")}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </span>
            </Link>
          </div>
        </HomeSectionShell>
      ) : null}

      {posts.items.length > 0 ? (
        <HomeSectionShell labelledBy="home-blog" tone="mist">
          <SectionHeading
            id="home-blog"
            kicker={t("blog.kicker")}
            title={t("blog.title")}
            action={{ href: "/blog", label: t("blog.all") }}
          />
          <SnapRow className="lg:grid-cols-3">
            {posts.items.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                categoryName={categoryName(post.category)}
                minutesLabel={t("blog.minutes", { count: post.readingMinutes })}
              />
            ))}
          </SnapRow>
        </HomeSectionShell>
      ) : null}

      {faqs.length > 0 ? (
        <HomeSectionShell labelledBy="home-faq">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
            <SectionHeading
              id="home-faq"
              kicker={t("faq.kicker")}
              title={t("faq.title")}
              subtitle={t("faq.lead")}
              action={{ href: "/faqs", label: t("faq.all") }}
              className="md:flex-col md:items-start md:justify-start"
            />
            <Accordion
              type="single"
              collapsible
              className="rounded-2xl border border-mist-200 bg-white px-4 md:px-6"
            >
              {faqs.slice(0, 5).map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="min-h-14 text-left text-[15.5px] font-semibold text-navy-900">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[15px] leading-relaxed text-mist-700">
                    {faq.answer}
                    {faq.link ? (
                      <Link
                        href={faq.link.href}
                        className="mt-2 block font-semibold text-brand-700 hover:underline"
                      >
                        {faq.link.label}
                      </Link>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </HomeSectionShell>
      ) : null}
    </>
  );
}

export { GalleryBlogFaqSection };
