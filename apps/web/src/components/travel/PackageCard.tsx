import { getTranslations } from "next-intl/server";
import { formatTaka, type TourPackage } from "@waafa/shared";
import { GoldTriangle } from "@/components/brand/GoldTriangle";
import { HoverVideo } from "@/components/media/HoverVideo";
import { SmartImage } from "@/components/media/SmartImage";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { CardFx } from "@/components/fx/CardFx";

type PackageCardProps = { pkg: TourPackage; sizes?: string };

/**
 * Tour package card (DESIGN.md "Cards"): cover, places, title, what is included, nights and "from ৳ per person,
 * twin share". The whole card is one link; desktop hover zooms the photo gently, plays the package clip when
 * there is one, and the card leans and glows towards the pointer.
 */
async function PackageCard({
  pkg,
  sizes = "(min-width: 1280px) 300px, (min-width: 768px) 45vw, 80vw",
}: PackageCardProps) {
  const t = await getTranslations("Home.packages");
  const tag = pkg.tags[0];

  return (
    <CardFx tilt spotlight className="rounded-2xl">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-md">
        <div className="relative">
          <SmartImage
            src={pkg.cover.src}
            focal={pkg.cover.focal}
            alt={pkg.cover.alt}
            ratio="4/3"
            sizes={sizes}
            zoomOnHover
          />
          {pkg.video ? <HoverVideo sources={{ mp4: pkg.video.mp4, webm: pkg.video.webm }} /> : null}
          {tag ? (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-navy-900 shadow-xs">
              {tag === "best-seller" ? <GoldTriangle className="size-2.5" /> : null}
              {t(`tags.${tag}`)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-[13px] font-medium text-brand-700">{pkg.placesLabel}</p>
          <h3 className="font-display text-[17px] leading-snug font-bold text-navy-900">
            <Link
              href={`/tour-packages/${pkg.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {pkg.title}
            </Link>
          </h3>
          {pkg.includesShort.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {pkg.includesShort.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-mist-100 px-2 py-0.5 text-[12px] font-medium text-mist-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className="min-w-0 text-[12.5px] text-mist-600">
              {t("from")} · {t("duration", { days: pkg.durationDays, nights: pkg.durationNights })}
              <span className="block font-display text-[20px] font-extrabold text-navy-900 tabular-nums">
                {formatTaka(pkg.fromPrice)}
              </span>
              {t("perPerson")}
            </p>
            <span
              aria-hidden="true"
              className="rounded-full bg-electric-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700"
            >
              {t("view")}
            </span>
          </div>
        </div>
      </article>
    </CardFx>
  );
}

export { PackageCard };
