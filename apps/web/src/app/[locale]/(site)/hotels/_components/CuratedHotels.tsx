import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/content/SectionHeading";
import { HotelCard } from "@/components/travel/HotelCard";
import { listHotels } from "@/lib/data/travel";

/**
 * "Hotels our team recommends" on /hotels (FR-HTL-02, issue 249): the curated hotels in admin order; nothing when
 * there are none.
 */
export async function CuratedHotels({ exceptSlug }: { exceptSlug?: string }) {
  const [hotels, t] = await Promise.all([listHotels(), getTranslations("Hotels")]);
  const shown = hotels.filter((hotel) => hotel.slug !== exceptSlug);
  if (shown.length === 0) return null;
  return (
    <section aria-labelledby="curated-hotels" className="flex flex-col gap-5">
      <SectionHeading
        id="curated-hotels"
        kicker={t("curated.kicker")}
        title={exceptSlug ? t("detail.more") : t("curated.title")}
        {...(exceptSlug ? {} : { subtitle: t("curated.lead") })}
      />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((hotel) => (
          <li key={hotel.id}>
            <HotelCard hotel={hotel} />
          </li>
        ))}
      </ul>
    </section>
  );
}
