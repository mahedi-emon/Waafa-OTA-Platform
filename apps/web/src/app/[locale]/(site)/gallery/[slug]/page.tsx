import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDate } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { getGalleryAlbum, listGalleryAlbums } from "@/lib/data/content";
import { AlbumGrid } from "./_components/AlbumGrid";

export async function generateStaticParams() {
  const albums = await listGalleryAlbums();
  return albums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [album, t] = await Promise.all([getGalleryAlbum(slug), getTranslations("Gallery")]);
  if (!album) return {};
  return {
    title: `${album.title} · ${t("metaTitle")}`,
    description: `${album.title}: ${t("items", { count: album.items.length })}. ${t("lead")}`,
    alternates: { canonical: `/gallery/${album.slug}` },
    openGraph: { images: [{ url: album.cover.src, alt: album.cover.alt }] },
  };
}

async function AlbumContent({ params }: Pick<PageProps<"/[locale]/gallery/[slug]">, "params">) {
  const { slug } = await params;
  const album = await getGalleryAlbum(slug);
  if (!album) notFound();
  const t = await getTranslations("Gallery");

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("kicker"), href: "/gallery" }, { label: album.title }]} />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t(`categories.${album.category}`)}
          </p>
          {album.sample ? <SampleBadge label={t("sample")} title={t("sampleNote")} /> : null}
        </div>
        <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-navy-900 md:text-[42px]">
          {album.title}
        </h1>
        <p className="text-[15px] text-mist-700">
          {formatDate(album.publishedAt)} · {t("items", { count: album.items.length })}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild variant="secondary">
            <Link href="/gallery">
              <ArrowLeft aria-hidden="true" />
              {t("album.all")}
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/tour-packages">
              {t("album.tours")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>
      <AlbumGrid
        title={album.title}
        items={album.items}
        labels={{
          openPhoto: t("album.openPhoto", { index: "{index}", total: "{total}" }),
          video: t("album.video"),
          videoOn: t("album.videoOn", { provider: "{provider}" }),
          providers: {
            youtube: t("album.providers.youtube"),
            facebook: t("album.providers.facebook"),
          },
          lightbox: {
            gallery: t("album.lightbox.gallery"),
            previous: t("album.lightbox.previous"),
            next: t("album.lightbox.next"),
          },
        }}
      />
      <p className="max-w-3xl rounded-2xl bg-mist-50 p-5 text-[14.5px] leading-relaxed text-mist-700">
        {t("consent")}
      </p>
    </main>
  );
}

/** /gallery/[slug] (Gallery-album, Gallery-photo, -m): the album's photos in a masonry grid with a lightbox. */
export default function AlbumPage({ params }: PageProps<"/[locale]/gallery/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-6 pb-28">
          <Skeleton className="h-12 w-1/2 rounded-xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      }
    >
      <AlbumContent params={params} />
    </Suspense>
  );
}
