import { ArrowRight, Clock3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatTaka } from "@waafa/shared";
import { CardFx } from "@/components/fx/CardFx";
import { SmartImage } from "@/components/media/SmartImage";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { Link } from "@/i18n/navigation";
import { listFlightRoutes } from "@/lib/data/travel";

/**
 * Popular routes from Dhaka (#99): photo cards for the admin's flight route pages, linked from /flights so search
 * engines and visitors find them. Hidden when no route is marked popular.
 */
async function PopularRoutes() {
  const [routes, t] = await Promise.all([listFlightRoutes(), getTranslations("Flights.routePage")]);
  const popular = routes.filter((route) => route.popular);
  if (popular.length === 0) return null;

  return (
    <section aria-labelledby="popular-routes" className="mt-8 flex flex-col gap-4">
      <ItemListJsonLd
        name={t("popular")}
        items={popular.map((route) => ({
          name: route.title,
          path: `/flights/${route.slug}`,
          image: route.image.src,
        }))}
      />
      <h2 id="popular-routes" className="type-h2 text-navy-900">
        {t("popular")}
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {popular.map((route) => (
          <li key={route.slug} className="reveal-on-view">
            <CardFx tilt className="rounded-2xl">
              <article className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-md">
                <SmartImage
                  src={route.image.src}
                  alt={route.image.alt}
                  ratio="16/9"
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 92vw"
                  zoomOnHover
                />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-[12px] font-bold tracking-[0.12em] text-brand-700 uppercase">
                    {route.from} → {route.to}
                  </p>
                  <h3 className="font-display text-[17px] leading-snug font-bold text-navy-900">
                    <Link
                      href={`/flights/${route.slug}`}
                      className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
                    >
                      {route.title}
                    </Link>
                  </h3>
                  <p className="flex items-center gap-1.5 text-[13.5px] text-mist-600">
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    {route.flightTime}
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    {route.fromPrice ? (
                      <p className="text-[12.5px] text-mist-600">
                        {t("fromFare")}
                        <span className="block font-display text-[19px] font-extrabold text-navy-900 tabular-nums">
                          {formatTaka(route.fromPrice)}
                        </span>
                      </p>
                    ) : (
                      <span />
                    )}
                    <span
                      aria-hidden="true"
                      className="grid size-10 place-items-center rounded-full bg-electric-50 text-brand-700 transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </article>
            </CardFx>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-mist-600">{t("indicative")}</p>
    </section>
  );
}

export { PopularRoutes };
