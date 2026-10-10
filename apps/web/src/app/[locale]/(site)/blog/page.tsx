import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Newspaper, Search } from "lucide-react";
import { cn } from "cn";
import { formatDate } from "@waafa/shared";
import { BlogCard } from "@/components/content/BlogCard";
import { PageHero } from "@/components/content/PageHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Canonical } from "@/components/seo/Canonical";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { SmartImage } from "@/components/media/SmartImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listBlogCategories, listBlogPosts } from "@/lib/data/content";
import { getFooterSettings } from "@/lib/data/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const PAGE = 9;

const one = (value: string | string[] | undefined) =>
  (typeof value === "string" ? value : "").trim();

async function BlogContent({ searchParams }: Pick<PageProps<"/[locale]/blog">, "searchParams">) {
  const params = await searchParams;
  const q = one(params.q).slice(0, 80);
  const categoryParam = one(params.category);
  const show = Math.min(60, Math.max(PAGE, Number(one(params.show)) || PAGE));
  const [categories, all, footer, t, tFooter] = await Promise.all([
    listBlogCategories(),
    listBlogPosts({ limit: 100 }),
    getFooterSettings(),
    getTranslations("Blog"),
    getTranslations("Footer"),
  ]);
  const category = categories.some((item) => item.slug === categoryParam)
    ? categoryParam
    : undefined;
  const filtered = await listBlogPosts({
    limit: show,
    ...(category ? { category } : {}),
    ...(q ? { search: q } : {}),
  });
  const names = new Map(categories.map((item) => [item.slug, item.name]));
  const featured =
    !q && !category ? (all.items.find((post) => post.featured) ?? all.items[0]) : undefined;
  const posts = filtered.items.filter((post) => post.id !== featured?.id);
  const counts = new Map<string, number>();
  for (const post of all.items) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  const href = (next: { category?: string; q?: string; show?: number }) => {
    const search = new URLSearchParams();
    if (next.category) search.set("category", next.category);
    if (next.q) search.set("q", next.q);
    if (next.show) search.set("show", String(next.show));
    const query = search.toString();
    return query ? `/blog?${query}` : "/blog";
  };

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:pt-6">
      <Canonical path="/blog" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero
          kicker={t("kicker")}
          title={t("title")}
          lead={t("lead")}
          aside={
            all.items.some((post) => post.sample) ? (
              <SampleBadge label={t("sample")} title={t("sampleNote")} />
            ) : null
          }
        />
      </div>

      {featured ? (
        <article className="group relative grid grid-cols-1 overflow-hidden rounded-[24px] border border-mist-200 bg-white lg:grid-cols-[1.25fr_1fr]">
          <SmartImage
            src={featured.cover.src}
            alt={featured.cover.alt}
            ratio="16/10"
            sizes="(min-width: 1024px) 700px, 100vw"
            preload
            frameClassName="lg:h-full"
            zoomOnHover
          />
          <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
            <p className="text-[13px] font-bold tracking-[0.12em] text-brand-700 uppercase">
              {t("editorsPick")} · {names.get(featured.category) ?? featured.category}
            </p>
            <h2 className="font-display text-[24px] leading-tight font-extrabold text-navy-900 md:text-[30px]">
              <Link
                href={`/blog/${featured.slug}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {featured.title}
              </Link>
            </h2>
            <p className="text-[15.5px] leading-relaxed text-mist-700">{featured.excerpt}</p>
            <p className="text-[13.5px] text-mist-600">
              {t("minutes", { minutes: featured.readingMinutes })} ·{" "}
              {formatDate(featured.publishedAt)} · {featured.author}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-700">
              {t("readGuide")}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </article>
      ) : null}

      <section aria-labelledby="blog-list" className="flex flex-col gap-5">
        <h2 id="blog-list" className="sr-only">
          {t("title")}
        </h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label={t("categoriesLabel")} className="flex flex-wrap gap-2">
            {[{ slug: undefined, name: t("all") }, ...categories].map((item) => {
              const active = item.slug === category;
              const count = item.slug ? (counts.get(item.slug) ?? 0) : all.total;
              return (
                <Link
                  key={item.slug ?? "all"}
                  href={href({
                    ...(item.slug ? { category: item.slug } : {}),
                    ...(q ? { q } : {}),
                  })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    active
                      ? "border-electric-600 bg-electric-50 text-navy-900"
                      : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
                  )}
                >
                  {item.name}
                  <span className="text-[12.5px] text-mist-600 tabular-nums">{count}</span>
                </Link>
              );
            })}
          </nav>
          <form action="/blog" method="get" role="search" className="flex gap-2">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <label htmlFor="blog-q" className="sr-only">
              {t("search")}
            </label>
            <input
              id="blog-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t("search")}
              className="h-12 w-full min-w-0 rounded-full border border-mist-300 bg-white px-4 text-base outline-none placeholder:text-mist-500 focus-visible:border-electric-600 focus-visible:ring-4 focus-visible:ring-ring/15 lg:w-64"
            />
            <Button type="submit" variant="secondary" size="icon" aria-label={t("searchButton")}>
              <Search aria-hidden="true" />
            </Button>
          </form>
        </div>
        <p aria-live="polite" className="text-[13.5px] text-mist-600">
          {t("results", { count: filtered.total })}
        </p>
        {posts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <BlogCard
                  post={post}
                  categoryName={names.get(post.category)}
                  minutesLabel={`${t("minutes", { minutes: post.readingMinutes })} · ${formatDate(post.publishedAt)}`}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                />
              </li>
            ))}
          </ul>
        ) : filtered.total === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={t("emptyTitle")}
            description={t("emptyBody")}
            action={
              <Button asChild variant="secondary">
                <Link href="/blog">{t("clear")}</Link>
              </Button>
            }
          />
        ) : null}
        {filtered.nextOffset !== null ? (
          <Button asChild variant="secondary" className="self-center">
            <Link
              href={href({
                ...(category ? { category } : {}),
                ...(q ? { q } : {}),
                show: show + PAGE,
              })}
              scroll={false}
            >
              {t("more")}
            </Link>
          </Button>
        ) : null}
      </section>

      <section
        aria-labelledby="blog-newsletter"
        className="grid grid-cols-1 gap-4 rounded-[24px] bg-navy-900 p-6 text-white md:grid-cols-[1fr_1fr] md:items-center md:p-10"
      >
        <div>
          <h2
            id="blog-newsletter"
            className="font-display text-[22px] font-extrabold md:text-[26px]"
          >
            {t("newsletterTitle")}
          </h2>
          <p className="mt-1 text-[14.5px] text-white/80">{t("newsletterLead")}</p>
        </div>
        <NewsletterForm
          source="blog"
          placeholder={footer.newsletterPlaceholder}
          button={footer.newsletterButton}
          labels={{
            email: tFooter("emailLabel"),
            invalid: tFooter("invalidEmail"),
            subscribed: tFooter("subscribed"),
            failed: tFooter("subscribeFailed"),
          }}
        />
      </section>
    </main>
  );
}

/** /blog (Blog, Blog-m): the editor's pick, topics with counts, search, the article grid and the newsletter. */
export default function BlogPage({ searchParams }: PageProps<"/[locale]/blog">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-6 pb-28">
          <Skeleton className="h-10 w-2/3 rounded-xl" />
          <Skeleton className="h-80 rounded-[24px]" />
        </div>
      }
    >
      <BlogContent searchParams={searchParams} />
    </Suspense>
  );
}
