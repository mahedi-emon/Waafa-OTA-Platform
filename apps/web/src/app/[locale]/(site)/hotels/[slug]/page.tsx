import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatTaka, whatsappLink, type Hotel } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Clock } from "@/components/icons/server/Clock";
import { MapPin } from "@/components/icons/server/MapPin";
import { Star } from "@/components/icons/server/Star";
import { Users } from "@/components/icons/server/Users";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { HotelAmenityIcon } from "@/components/travel/HotelAmenityIcon";
import { hotelFromPrice } from "@/components/travel/HotelCard";
import { PhotoGallery } from "@/components/travel/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContactSettings } from "@/lib/data/settings";
import { getHotel, listHotels } from "@/lib/data/travel";
import { recordRobots } from "@/lib/seo/indexing";
import { withSocial } from "@/lib/seo/withSocial";
import { absoluteUrl } from "@/lib/siteUrl";
import { CuratedHotels } from "../_components/CuratedHotels";

export async function generateStaticParams() {
  const hotels = await listHotels();
  return hotels.map((hotel) => ({ slug: hotel.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/hotels/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotel(slug);
  if (!hotel) return {};
  const title = hotel.seo.title ?? `${hotel.name}, ${hotel.city}`;
  const description = hotel.seo.description ?? hotel.summary;
  return withSocial({
    title,
    description,
    alternates: { canonical: `/hotels/${hotel.slug}` },
    openGraph: { title, description, images: [{ url: hotel.cover.src, alt: hotel.cover.alt }] },
    ...recordRobots(hotel),
  });
}

/** The hotel request on /hotels, started with this hotel (and room type) and its city's search place. */
function requestHref(hotel: Hotel, roomId?: string) {
  const query = new URLSearchParams({ hotel: hotel.slug });
  if (roomId) query.set("room", roomId);
  if (hotel.placeId) {
    query.set("place", hotel.placeId);
    query.set("placeName", hotel.city);
  }
  return `/hotels?${query.toString()}`;
}

const h2 = "font-display text-[22px] font-bold text-navy-900 md:text-[26px]";

async function HotelDetail({ params }: Pick<PageProps<"/[locale]/hotels/[slug]">, "params">) {
  const { slug } = await params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  const [contact, t, tr] = await Promise.all([
    getContactSettings(),
    getTranslations("Hotels.detail"),
    getTranslations("Hotels"),
  ]);
  const images = [hotel.cover, ...hotel.gallery];
  const from = formatTaka(hotelFromPrice(hotel));
  const stars = tr("curated.stars", { count: hotel.stars });

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: hotel.name,
          description: hotel.summary,
          url: absoluteUrl(`/hotels/${hotel.slug}`),
          image: images.map((image) => absoluteUrl(image.src)),
          starRating: { "@type": "Rating", ratingValue: hotel.stars },
          address: {
            "@type": "PostalAddress",
            addressLocality: hotel.city,
            addressCountry: hotel.country,
          },
          priceRange: `From ${from} per night`,
        }}
      />
      <Breadcrumbs items={[{ label: t("breadcrumb"), href: "/hotels" }, { label: hotel.name }]} />
      <PhotoGallery
        images={images}
        title={hotel.name}
        labels={{
          all: t("photos", { count: images.length }),
          gallery: t("gallery"),
          previous: t("previous"),
          next: t("next"),
        }}
      />

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="flex text-brand-700" role="img" aria-label={stars}>
            {Array.from({ length: hotel.stars }, (_, index) => (
              <Star key={index} aria-hidden="true" className="size-4 fill-current" />
            ))}
          </span>
          <span className="flex items-center gap-1 text-mist-700">
            <MapPin aria-hidden="true" className="size-4" />
            {hotel.area ?? hotel.city}, {hotel.country}
          </span>
          {hotel.sample ? <SampleBadge label={t("sample")} /> : null}
        </div>
        <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[42px]">
          {hotel.name}
        </h1>
        <p className="max-w-[62ch] text-[16px] text-mist-700">{hotel.summary}</p>
        {hotel.checkIn || hotel.checkOut ? (
          <ul className="flex flex-wrap gap-2 text-[13.5px] text-mist-700">
            {hotel.checkIn ? (
              <li className="flex items-center gap-1.5 rounded-full bg-mist-100 px-3 py-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {t("checkIn", { time: hotel.checkIn })}
              </li>
            ) : null}
            {hotel.checkOut ? (
              <li className="flex items-center gap-1.5 rounded-full bg-mist-100 px-3 py-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {t("checkOut", { time: hotel.checkOut })}
              </li>
            ) : null}
          </ul>
        ) : null}
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="hotel-overview" className="flex flex-col gap-4">
            <h2 id="hotel-overview" className={h2}>
              {t("overview")}
            </h2>
            {hotel.description.map((paragraph) => (
              <p key={paragraph} className="max-w-[68ch] text-[16px] leading-relaxed text-ink-900">
                {paragraph}
              </p>
            ))}
          </section>

          {hotel.amenities.length > 0 ? (
            <section aria-labelledby="hotel-amenities" className="flex flex-col gap-4">
              <h2 id="hotel-amenities" className={h2}>
                {t("amenities")}
              </h2>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-3 min-[400px]:grid-cols-2 md:grid-cols-3">
                {hotel.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-3 text-[15px] text-ink-900">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-electric-50 text-brand-700">
                      <HotelAmenityIcon amenity={amenity} className="size-[18px]" />
                    </span>
                    {tr(`amenities.${amenity}`)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="hotel-rooms" className="flex flex-col gap-4">
            <h2 id="hotel-rooms" className={h2}>
              {t("rooms")}
            </h2>
            <ul className="flex flex-col gap-4">
              {hotel.rooms.map((room) => (
                <li
                  key={room.id}
                  className="grid grid-cols-1 overflow-hidden rounded-2xl border border-mist-200 bg-white sm:grid-cols-[220px_minmax(0,1fr)]"
                >
                  {room.image ? (
                    <SmartImage
                      src={room.image.src}
                      focal={room.image.focal}
                      alt={room.image.alt}
                      ratio="4/3"
                      sizes="(min-width: 640px) 220px, 100vw"
                      className="sm:h-full"
                    />
                  ) : null}
                  <div className="flex flex-col gap-3 p-4 sm:p-5">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display text-[18px] font-bold text-navy-900">
                        {room.name}
                      </h3>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-mist-700">
                        <span>{room.beds}</span>
                        <span className="flex items-center gap-1">
                          <Users aria-hidden="true" className="size-3.5" />
                          {t("sleeps", { count: room.sleeps })}
                        </span>
                        {room.size ? <span>{room.size}</span> : null}
                      </p>
                    </div>
                    {room.features.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {room.features.map((feature) => (
                          <li
                            key={feature}
                            className="rounded-full bg-mist-100 px-2.5 py-0.5 text-[12.5px] font-medium text-mist-700"
                          >
                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
                      <p className="text-[12.5px] text-mist-600">
                        <span className="block font-display text-[20px] font-extrabold text-navy-900 tabular-nums">
                          {t("from", { price: formatTaka(room.fromPrice) })}
                        </span>
                        {t("perNight")}
                      </p>
                      <Button asChild size="sm">
                        <Link href={requestHref(hotel, room.id)} prefetch={false}>
                          {t("requestRoom", { room: room.name })}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="order-first lg:order-none">
          <div className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
            <p className="text-[13px] text-mist-600">
              <span className="block font-display text-[26px] font-extrabold text-navy-900 tabular-nums">
                {t("from", { price: from })}
              </span>
              {t("perNight")}
            </p>
            <Button asChild size="lg" className="w-full">
              <Link href={requestHref(hotel)} prefetch={false}>
                {t("request")}
              </Link>
            </Button>
            <Button asChild variant="whatsapp" size="lg" className="w-full">
              <a
                href={whatsappLink(contact.whatsappE164, t("whatsappText", { hotel: hotel.name }))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-4" />
                {t("askWhatsApp")}
              </a>
            </Button>
            <p className="text-[13px] leading-relaxed text-mist-600">{t("indicative")}</p>
          </div>
        </aside>
      </div>

      <CuratedHotels exceptSlug={hotel.slug} />
    </main>
  );
}

/** /hotels/[slug] (FR-HTL-02, issue 249): a curated hotel with photos, amenities, room types and Request booking. */
export default function HotelPage(props: PageProps<"/[locale]/hotels/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-4 pb-28" aria-hidden="true">
          <Skeleton className="h-[360px] rounded-[20px]" />
          <Skeleton className="h-[220px] rounded-[20px]" />
        </div>
      }
    >
      <HotelDetail params={props.params} />
    </Suspense>
  );
}
