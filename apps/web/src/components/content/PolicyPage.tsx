import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { formatDate } from "@waafa/shared";
import { ArticleContents } from "@/components/content/ArticleContents";
import { PageHero } from "@/components/content/PageHero";
import { RichText } from "@/components/content/RichText";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Canonical } from "@/components/seo/Canonical";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getPage } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";

type PolicyPageProps = { slug: string; path: string };

/**
 * Refund, Privacy and Terms (Refund, Privacy, Terms boards): admin rich text with the "In short" list, an "On this
 * page" index and a questions card. Sample text stays marked until the owner's legal review.
 */
async function PolicyPage({ slug, path }: PolicyPageProps) {
  const [page, contact, t] = await Promise.all([
    getPage(slug),
    getContactSettings(),
    getTranslations("Policy"),
  ]);
  if (!page) notFound();

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <Canonical path={path} />
      <Breadcrumbs items={[{ label: page.title }]} />
      <PageHero
        kicker={t("kicker")}
        title={page.title}
        lead={page.summary}
        aside={page.sample ? <SampleBadge label={t("sample")} /> : null}
      >
        <p className="text-[13.5px] text-mist-600">
          {t("updated", { date: formatDate(page.lastUpdated) })}
        </p>
      </PageHero>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <ArticleContents
          label={t("contents")}
          items={page.sections.map((section) => ({ id: section.id, heading: section.heading }))}
        />
        <article className="flex max-w-[72ch] min-w-0 flex-col gap-8">
          {page.highlights.length > 0 ? (
            <section
              aria-labelledby="policy-short"
              className="flex flex-col gap-3 rounded-2xl border border-electric-100 bg-electric-50 p-5"
            >
              <h2 id="policy-short" className="font-display text-[18px] font-bold text-navy-900">
                {t("inShort")}
              </h2>
              <ul className="flex flex-col gap-2">
                {page.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] text-ink-900">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {page.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="flex scroll-mt-28 flex-col gap-3"
            >
              <h2
                id={`${section.id}-title`}
                className="font-display text-[22px] font-bold text-navy-900"
              >
                {section.heading}
              </h2>
              <RichText html={section.body} />
            </section>
          ))}
          <aside
            aria-labelledby="policy-questions"
            className="flex flex-col gap-3 rounded-2xl bg-mist-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 id="policy-questions" className="text-[16px] font-bold text-navy-900">
                {t("questionsTitle")}
              </h2>
              <p className="text-[14.5px] text-mist-700">
                {t("questionsBody", { phone: contact.phoneDisplay, email: contact.email })}
              </p>
            </div>
            <Button asChild variant="secondary" className="shrink-0">
              <Link href="/contact">{t("contact")}</Link>
            </Button>
          </aside>
        </article>
      </div>
    </main>
  );
}

export { PolicyPage };
