import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@waafa/shared";
import { ArticleContents } from "@/components/content/ArticleContents";
import { BlogCard } from "@/components/content/BlogCard";
import { RichText } from "@/components/content/RichText";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  getBlogPost,
  listBlogCategories,
  listBlogPosts,
  listRelatedBlogPosts,
} from "@/lib/data/content";
import { getSiteSettings } from "@/lib/data/settings";
import { absoluteUrl } from "@/lib/siteUrl";

export async function generateStaticParams() {
  const posts = await listBlogPosts({ limit: 100 });
  return posts.items.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  const title = post.seo.title ?? post.title;
  const description = post.seo.description ?? post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      images: [{ url: post.cover.src, alt: post.cover.alt }],
    },
    ...(post.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

const CTA_HREF = {
  flights: "/flights",
  packages: "/tour-packages",
  visa: "/visa-services",
  shop: "/shop",
  contact: "/contact",
} as const;

const initialsOf = (name: string) =>
  name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** The article (BlogPost, BlogPost-m): contents list, rich text sections, a call to action and related posts. */
async function BlogPostContent({ params }: Pick<PageProps<"/[locale]/blog/[slug]">, "params">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  const [categories, related, site, t, tBlog] = await Promise.all([
    listBlogCategories(),
    listRelatedBlogPosts(slug, 3),
    getSiteSettings(),
    getTranslations("Blog.post"),
    getTranslations("Blog"),
  ]);
  const names = new Map(categories.map((item) => [item.slug, item.name]));
  const categoryName = names.get(post.category) ?? post.category;
  const cta = post.cta;

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: [post.cover.src],
          datePublished: post.publishedAt,
          author: { "@type": "Person", name: post.author },
          publisher: { "@type": "Organization", name: site.travelBrand },
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
        }}
      />
      <Breadcrumbs
        items={[
          { label: tBlog("kicker"), href: "/blog" },
          { label: categoryName, href: `/blog?category=${post.category}` },
        ]}
      />
      <header className="flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {categoryName}
          </p>
          {post.sample ? <SampleBadge label={t("sampleArticle")} /> : null}
        </div>
        <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[42px]">
          {post.title}
        </h1>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-full bg-navy-900 font-display text-[13px] font-extrabold text-white"
          >
            {initialsOf(post.author)}
          </span>
          <p className="text-[14px] leading-tight">
            <span className="block font-semibold text-navy-900">{post.author}</span>
            <span className="text-mist-600">
              {t("meta", { date: formatDate(post.publishedAt), minutes: post.readingMinutes })}
            </span>
          </p>
        </div>
      </header>

      <figure className="flex flex-col gap-2">
        <SmartImage
          src={post.cover.src}
          alt={post.cover.alt}
          ratio="21/9"
          sizes="(min-width: 1280px) 1200px, 100vw"
          preload
          className="rounded-[20px]"
        />
        {post.cover.credit ? (
          <figcaption className="text-[12.5px] text-mist-600">{post.cover.credit}</figcaption>
        ) : null}
      </figure>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <ArticleContents
          label={t("contents")}
          items={post.sections.map((section) => ({ id: section.id, heading: section.heading }))}
        />
        <article className="flex max-w-[72ch] min-w-0 flex-col gap-8">
          <p className="text-[18px] leading-relaxed text-mist-700">{post.intro}</p>
          {post.sections.map((section) => (
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
            aria-labelledby="post-cta"
            className="flex flex-col gap-3 rounded-[20px] bg-navy-900 p-6 text-white"
          >
            <h2 id="post-cta" className="font-display text-[20px] font-extrabold">
              {t(`cta.${cta}.title`)}
            </h2>
            <p className="text-[15px] text-white/80">{t(`cta.${cta}.body`)}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="white">
                <Link href={CTA_HREF[cta]}>
                  {t(`cta.${cta}.action`)}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {cta === "packages" ? (
                <Button asChild variant="glass">
                  <Link href="/plan-my-trip">{t("planOwn")}</Link>
                </Button>
              ) : null}
            </div>
          </aside>
        </article>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="post-related" className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-3">
            <h2 id="post-related" className="type-h2 text-navy-900">
              {t("keepReading")}
            </h2>
            <Link
              href="/blog"
              className="inline-flex min-h-11 items-center gap-1.5 text-[14.5px] font-semibold text-brand-700 hover:underline"
            >
              {t("allArticles")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <BlogCard
                  post={item}
                  categoryName={names.get(item.category)}
                  minutesLabel={tBlog("minutes", { minutes: item.readingMinutes })}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

/** /blog/[slug]: awaits the slug inside Suspense (D85) so the shell stays static. */
export default function BlogPostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-6 pb-28">
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="aspect-[21/9] rounded-[20px]" />
        </div>
      }
    >
      <BlogPostContent params={params} />
    </Suspense>
  );
}
