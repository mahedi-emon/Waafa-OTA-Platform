import { Clock3, Stamp } from "@/components/icons/serverIcons";
import type { Destination } from "@waafa/shared";
import { CountryFlag } from "@/components/media/CountryFlag";
import { SmartImage } from "@/components/media/SmartImage";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { CardFx } from "@/components/fx/CardFx";

type DestinationCardProps = {
  destination: Destination;
  /** The country of the destination airport, for the flag in the corner. */
  countryCode?: string | null;
  /** "3 h 30 m flight" and "From ৳38,500", already formatted by the caller. */
  labels: { flight: string; price: string };
  sizes?: string;
};

/** Destination tile (DESIGN.md "Cards"): real photo with a bottom gradient, the country flag, flight time, visa note and price from. */
function DestinationCard({
  destination,
  countryCode,
  labels,
  sizes = "(min-width: 1280px) 200px, (min-width: 768px) 33vw, 50vw",
}: DestinationCardProps) {
  return (
    <CardFx tilt spotlight={false} className="rounded-2xl">
      <article className="group relative isolate overflow-hidden rounded-2xl bg-navy-900">
        <SmartImage
          src={destination.image.src}
          focal={destination.image.focal}
          alt={destination.image.alt}
          ratio="3/4"
          sizes={sizes}
          zoomOnHover
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-midnight-950/85 via-midnight-950/25 to-transparent"
        />
        {countryCode ? (
          <CountryFlag
            code={countryCode}
            size="md"
            className="absolute top-3 left-3 ring-2 ring-white/80 md:top-3.5 md:left-3.5"
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3.5 text-white md:p-4">
          <h3 className="font-display text-[18px] leading-tight font-bold">
            <Link
              href={`/tour-packages?destination=${destination.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {destination.name}
            </Link>
          </h3>
          <p className="line-clamp-1 text-[13px] text-white/85">{destination.subtitle}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/90">
            <span className="inline-flex items-center gap-1">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {labels.flight}
            </span>
            <span className="inline-flex items-center gap-1">
              <Stamp aria-hidden="true" className="size-3.5" />
              {destination.visaNote}
            </span>
          </p>
          <p className="font-display text-[15px] font-extrabold tabular-nums">{labels.price}</p>
        </div>
      </article>
    </CardFx>
  );
}

export { DestinationCard };
