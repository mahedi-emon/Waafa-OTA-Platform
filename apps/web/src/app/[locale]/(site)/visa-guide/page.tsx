import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatShortMonth } from "@/lib/search/isoDate";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { Canonical } from "@/components/seo/Canonical";
import { Link } from "@/i18n/navigation";
import { listVisaGuides } from "@/lib/data/visa";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Visa.guide");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

/** /visa-guide (VisaGuide, VisaGuide-m boards): the most-read guide first, then every guide. */
export default async function VisaGuidePage() {
  const [guides, t] = await Promise.all([listVisaGuides(), getTranslations("Visa.guide")]);
  const [featured, ...rest] = guides;
  const meta = (minutes: number, date: string) =>
    t("meta", { minutes, date: formatShortMonth(date.slice(0, 7)) });

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:pt-6">
      <Canonical path="/visa-guide" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <header className="flex max-w-3xl flex-col gap-3">
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t("kicker")}
          </p>
          <h1 className="font-display text-[32px] leading-[1.08] font-extrabold tracking-tight text-balance text-navy-900 md:text-[46px]">
            {t("title")}
          </h1>
          <p className="text-[16px] leading-relaxed text-mist-700 md:text-[18px]">{t("lead")}</p>
        </header>
      </div>

      {featured ? (
        <article className="group relative grid grid-cols-1 overflow-hidden rounded-[24px] border border-mist-200 bg-white md:grid-cols-2">
          <SmartImage
            src={featured.cover.src}
            alt={featured.cover.alt}
            ratio="16/10"
            sizes="(min-width: 768px) 50vw, 100vw"
            preload
            className="md:h-full"
          />
          <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
            <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
              {t("featured")}
            </p>
            <h2 className="font-display text-[24px] leading-tight font-extrabold text-navy-900 md:text-[30px]">
              <Link
                href={`/visa-guide/${featured.slug}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {featured.title}
              </Link>
            </h2>
            <p className="text-[15px] leading-relaxed text-mist-700">{featured.summary}</p>
            <p className="text-[13px] text-mist-600">
              {meta(featured.readingMinutes, featured.updatedAt)}
            </p>
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-700"
            >
              {t("read")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </article>
      ) : (
        <EmptyState icon={BookOpen} title={t("empty")} description={t("emptyBody")} />
      )}

      {rest.length > 0 ? (
        <section aria-labelledby="guides-all" className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="guides-all" className="font-display text-[22px] font-bold text-navy-900">
              {t("all")}
            </h2>
            {rest.some((guide) => guide.sample) ? <SampleBadge label={t("sample")} /> : null}
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((guide) => (
              <li key={guide.slug}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white">
                  <SmartImage
                    src={guide.cover.src}
                    alt={guide.cover.alt}
                    ratio="16/9"
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 100vw"
                    zoomOnHover
                  />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-display text-[17px] leading-snug font-bold text-navy-900">
                      <Link
                        href={`/visa-guide/${guide.slug}`}
                        className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
                      >
                        {guide.title}
                      </Link>
                    </h3>
                    <p className="line-clamp-2 text-[14px] text-mist-700">{guide.summary}</p>
                    <p className="mt-auto pt-1 text-[13px] text-mist-600">
                      {meta(guide.readingMinutes, guide.updatedAt)}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
