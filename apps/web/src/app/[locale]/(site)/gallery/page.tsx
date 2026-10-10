import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Images } from "lucide-react";
import { cn } from "cn";
import {
  GalleryCategorySchema,
  formatDate,
  whatsappLink,
  type GalleryCategory,
} from "@waafa/shared";
import { PageHero } from "@/components/content/PageHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { Canonical } from "@/components/seo/Canonical";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listGalleryAlbums } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

async function GalleryContent({
  searchParams,
}: Pick<PageProps<"/[locale]/gallery">, "searchParams">) {
  const params = await searchParams;
  const raw = typeof params.category === "string" ? params.category : "";
  const parsed = GalleryCategorySchema.safeParse(raw);
  const category: GalleryCategory | undefined = parsed.success ? parsed.data : undefined;
  const [all, contact, t] = await Promise.all([
    listGalleryAlbums(),
    getContactSettings(),
    getTranslations("Gallery"),
  ]);
  const albums = category ? all.filter((album) => album.category === category) : all;
  const latest = category ? undefined : all[0];
  const grid = latest ? albums.filter((album) => album.id !== latest.id) : albums;
  const counts = new Map<GalleryCategory, number>();
  for (const album of all) counts.set(album.category, (counts.get(album.category) ?? 0) + 1);
  const chips = GalleryCategorySchema.options.filter((key) => (counts.get(key) ?? 0) > 0);

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:pt-6">
      <Canonical path="/gallery" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero
          kicker={t("kicker")}
          title={t("title")}
          lead={t("lead")}
          aside={
            all.some((album) => album.sample) ? (
              <SampleBadge label={t("sample")} title={t("sampleNote")} />
            ) : null
          }
          actions={
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(contact.whatsappE164, t("shareMessage"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                {t("share")}
              </a>
            </Button>
          }
        />
      </div>

      {latest ? (
        <article className="group relative overflow-hidden rounded-[24px] bg-navy-900">
          <SmartImage
            src={latest.cover.src}
            alt={latest.cover.alt}
            ratio="21/9"
            sizes="(min-width: 1280px) 1200px, 100vw"
            preload
            frameClassName="min-h-[260px]"
            className="opacity-80"
            zoomOnHover
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-navy-900/95 via-navy-900/60 to-transparent p-5 text-white md:p-8">
            <p className="text-[12.5px] font-bold tracking-[0.14em] text-cyan-400 uppercase">
              {t("latest")}
            </p>
            <h2 className="font-display text-[24px] leading-tight font-extrabold md:text-[32px]">
              <Link
                href={`/gallery/${latest.slug}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {latest.title}
              </Link>
            </h2>
            <p className="text-[14px] text-white/80">
              {formatDate(latest.publishedAt)} · {t("items", { count: latest.items.length })}
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 text-[14.5px] font-semibold">
              {t("open")}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </article>
      ) : null}

      <section aria-labelledby="gallery-albums" className="flex flex-col gap-5">
        <h2 id="gallery-albums" className="sr-only">
          {t("albums", { count: albums.length })}
        </h2>
        {chips.length > 1 ? (
          <nav aria-label={t("categoriesLabel")} className="flex flex-wrap gap-2">
            {[undefined, ...chips].map((key) => {
              const active = key === category;
              return (
                <Link
                  key={key ?? "all"}
                  href={key ? `/gallery?category=${key}` : "/gallery"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    active
                      ? "border-electric-600 bg-electric-50 text-navy-900"
                      : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
                  )}
                >
                  {key ? t(`categories.${key}`) : t("all")}
                  <span className="text-[12.5px] text-mist-600 tabular-nums">
                    {key ? (counts.get(key) ?? 0) : all.length}
                  </span>
                </Link>
              );
            })}
          </nav>
        ) : null}
        {grid.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((album) => (
              <li key={album.id}>
                <article className="group relative flex flex-col gap-3">
                  <div className="relative">
                    <SmartImage
                      src={album.cover.src}
                      alt={album.cover.alt}
                      ratio="4/3"
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      frameClassName="rounded-2xl"
                      zoomOnHover
                    />
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-navy-900/80 px-2.5 py-1 text-[12.5px] font-semibold text-white">
                      <Images aria-hidden="true" className="size-3.5" />
                      {album.items.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-[17px] font-bold text-navy-900">
                      <Link
                        href={`/gallery/${album.slug}`}
                        className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
                      >
                        {album.title}
                      </Link>
                    </h3>
                    <p className="text-[13.5px] text-mist-600">
                      {t(`categories.${album.category}`)} · {formatDate(album.publishedAt)}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : albums.length === 0 ? (
          <EmptyState icon={Images} title={t("emptyTitle")} description={t("emptyBody")} />
        ) : null}
      </section>

      <p className="max-w-3xl rounded-2xl bg-mist-50 p-5 text-[14.5px] leading-relaxed text-mist-700">
        {t("consent")}
      </p>
    </main>
  );
}

/** /gallery (Gallery, Gallery-m): the latest album, albums by kind, and how travellers' photos get here. */
export default function GalleryPage({ searchParams }: PageProps<"/[locale]/gallery">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-6 pb-28">
          <Skeleton className="h-10 w-2/3 rounded-xl" />
          <Skeleton className="aspect-[21/9] rounded-[24px]" />
        </div>
      }
    >
      <GalleryContent searchParams={searchParams} />
    </Suspense>
  );
}
