import { getTranslations } from "next-intl/server";
import { formatTaka, type Hotel } from "@waafa/shared";
import { CardFx } from "@/components/fx/CardFx";
import { MapPin } from "@/components/icons/server/MapPin";
import { Star } from "@/components/icons/server/Star";
import { SmartImage } from "@/components/media/SmartImage";
import { LocalLink as Link } from "@/components/nav/LocalLink";

type HotelCardProps = { hotel: Hotel; sizes?: string };

/** The lowest room price of a curated hotel: its "from" price per night. */
export const hotelFromPrice = (hotel: Pick<Hotel, "rooms">) =>
  Math.min(...hotel.rooms.map((room) => room.fromPrice));

/**
 * Curated hotel card (FR-HTL-02, DESIGN.md "Cards"): cover, stars, area, name, three amenities and "from ৳ per
 * night". The whole card is one link to the hotel's page; desktop hover zooms the photo gently.
 */
async function HotelCard({
  hotel,
  sizes = "(min-width: 1280px) 380px, (min-width: 768px) 45vw, 90vw",
}: HotelCardProps) {
  const t = await getTranslations("Hotels");
  return (
    <CardFx tilt spotlight className="rounded-2xl">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-md">
        <SmartImage
          src={hotel.cover.src}
          focal={hotel.cover.focal}
          alt={hotel.cover.alt}
          ratio="4/3"
          sizes={sizes}
          zoomOnHover
        />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-brand-700">
            <span
              className="flex"
              role="img"
              aria-label={t("curated.stars", { count: hotel.stars })}
            >
              {Array.from({ length: hotel.stars }, (_, index) => (
                <Star key={index} aria-hidden="true" className="size-3.5 fill-current" />
              ))}
            </span>
            <span className="flex min-w-0 items-center gap-1 text-mist-600">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{hotel.area ?? `${hotel.city}, ${hotel.country}`}</span>
            </span>
          </p>
          <h3 className="font-display text-[17px] leading-snug font-bold text-navy-900">
            <Link
              href={`/hotels/${hotel.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {hotel.name}
            </Link>
          </h3>
          <p className="text-[14px] text-mist-700">{hotel.summary}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className="min-w-0 text-[12.5px] text-mist-600">
              <span className="block font-display text-[20px] font-extrabold text-navy-900 tabular-nums">
                {t("curated.from", { price: formatTaka(hotelFromPrice(hotel)) })}
              </span>
              {t("curated.perNight")}
            </p>
            <span
              aria-hidden="true"
              className="rounded-full bg-electric-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700"
            >
              {t("curated.viewHotel")}
            </span>
          </div>
        </div>
      </article>
    </CardFx>
  );
}

export { HotelCard };
