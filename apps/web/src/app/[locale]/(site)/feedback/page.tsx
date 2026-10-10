import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ArrowUpRight, MessageSquareQuote } from "lucide-react";
import { cn } from "cn";
import { FeedbackServiceSchema, formatDate, type FeedbackService } from "@waafa/shared";
import { PageHero } from "@/components/content/PageHero";
import { RatingStars } from "@/components/content/RatingStars";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { Canonical } from "@/components/seo/Canonical";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { pickMessages } from "@/i18n/pickMessages";
import { listPublicFeedback } from "@/lib/data/content";
import { getLeadFormSettings, getSiteSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { FeedbackForm } from "./_components/FeedbackForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Feedback");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

async function FeedbackContent({
  searchParams,
}: Pick<PageProps<"/[locale]/feedback">, "searchParams">) {
  const params = await searchParams;
  const raw = typeof params.service === "string" ? params.service : "";
  const parsed = FeedbackServiceSchema.safeParse(raw);
  const service: FeedbackService | undefined = parsed.success ? parsed.data : undefined;
  const [all, site, leadForm, messages, t] = await Promise.all([
    listPublicFeedback(),
    getSiteSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Feedback"),
  ]);
  const shown = service ? all.filter((item) => item.service === service) : all;
  const counts = new Map<FeedbackService, number>();
  for (const item of all) counts.set(item.service, (counts.get(item.service) ?? 0) + 1);
  const chips = FeedbackServiceSchema.options.filter((key) => (counts.get(key) ?? 0) > 0);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:pt-6">
      <Canonical path="/feedback" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero
          kicker={t("kicker")}
          title={t("title")}
          lead={t("lead")}
          actions={
            site.reviewsUrl ? (
              <Button asChild variant="secondary">
                <a href={site.reviewsUrl} target="_blank" rel="noopener noreferrer">
                  {t("facebook")}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            ) : null
          }
        />
      </div>

      <section aria-labelledby="feedback-wall" className="flex flex-col gap-5">
        <h2 id="feedback-wall" className="sr-only">
          {t("title")}
        </h2>
        {chips.length > 1 ? (
          <nav aria-label={t("categoriesLabel")} className="flex flex-wrap gap-2">
            {[undefined, ...chips].map((key) => {
              const active = key === service;
              return (
                <Link
                  key={key ?? "all"}
                  href={key ? `/feedback?service=${key}` : "/feedback"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    active
                      ? "border-electric-600 bg-electric-50 text-navy-900"
                      : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
                  )}
                >
                  {key ? t(`services.${key}`) : t("all")}
                  <span className="text-[12.5px] text-mist-600 tabular-nums">
                    {key ? (counts.get(key) ?? 0) : all.length}
                  </span>
                </Link>
              );
            })}
          </nav>
        ) : null}
        {shown.length > 0 ? (
          <ul className="columns-1 gap-4 md:columns-2 lg:columns-3 [&>li]:mb-4">
            {shown.map((item) => (
              <li key={item.id} className="break-inside-avoid">
                <figure className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5">
                  <figcaption className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-electric-50 font-display text-[14px] font-extrabold text-brand-700"
                    >
                      {firstName(item.name).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-navy-900">
                        {firstName(item.name)}
                      </span>
                      <span className="block text-[13px] text-mist-600">
                        {t(`services.${item.service}`)} · {formatDate(item.submittedAt)}
                      </span>
                    </span>
                  </figcaption>
                  {item.rating ? (
                    <RatingStars
                      rating={item.rating}
                      label={t("rating", { rating: item.rating })}
                    />
                  ) : null}
                  {item.photo ? (
                    <SmartImage
                      src={item.photo.src}
                      alt={item.photo.alt}
                      ratio="4/3"
                      sizes="(min-width: 1024px) 380px, 100vw"
                      frameClassName="rounded-xl"
                    />
                  ) : null}
                  <blockquote className="text-[15px] leading-relaxed text-ink-900">
                    {item.comment}
                  </blockquote>
                </figure>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MessageSquareQuote}
            title={t("emptyTitle")}
            description={t("emptyBody")}
            action={
              <Button asChild>
                <a href="#feedback-form">{t("form.title")}</a>
              </Button>
            }
          />
        )}
      </section>

      <section
        id="feedback-form"
        aria-labelledby="feedback-form-title"
        className="grid scroll-mt-28 grid-cols-1 gap-6 rounded-[24px] border border-mist-200 bg-white p-5 md:p-8 lg:grid-cols-[1fr_1.4fr] lg:gap-10"
      >
        <div className="flex flex-col gap-2">
          <h2 id="feedback-form-title" className="type-h2 text-navy-900">
            {t("form.title")}
          </h2>
          <p className="text-[15px] text-mist-700">{t("form.lead")}</p>
        </div>
        <NextIntlClientProvider messages={pickMessages(messages, ["Feedback"])}>
          <FeedbackForm countries={countries} />
        </NextIntlClientProvider>
      </section>
    </main>
  );
}

/** /feedback (Feedback, Feedback-sent, Feedback-m): the moderated wall (approved and consented only) and the form. */
export default function FeedbackPage({ searchParams }: PageProps<"/[locale]/feedback">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-6 pb-28">
          <Skeleton className="h-10 w-2/3 rounded-xl" />
          <Skeleton className="h-72 rounded-[24px]" />
        </div>
      }
    >
      <FeedbackContent searchParams={searchParams} />
    </Suspense>
  );
}
