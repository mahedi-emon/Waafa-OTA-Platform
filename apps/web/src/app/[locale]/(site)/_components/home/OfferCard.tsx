import type { Banner } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { Link } from "@/i18n/navigation";

type OfferCardProps = { offer: Banner; viewLabel: string };

/** Offer card (Home "Offers worth a look"): photo, kicker and validity, title, one line and the promo code. */
function OfferCard({ offer, viewLabel }: OfferCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-md">
      <SmartImage
        src={offer.image.src}
        alt={offer.image.alt}
        ratio="16/10"
        sizes="(min-width: 1024px) 400px, 82vw"
        zoomOnHover
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {offer.kicker || offer.validityText ? (
          <p className="flex flex-wrap items-center gap-2 text-[12.5px]">
            {offer.kicker ? (
              <span className="font-semibold text-brand-700">{offer.kicker}</span>
            ) : null}
            {offer.validityText ? (
              <span className="text-mist-600">{offer.validityText}</span>
            ) : null}
          </p>
        ) : null}
        <h3 className="font-display text-[18px] leading-snug font-bold text-navy-900">
          <Link
            href={offer.link.href}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {offer.title}
          </Link>
        </h3>
        {offer.body ? (
          <p className="text-[14px] leading-relaxed text-mist-600">{offer.body}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {offer.code ? (
            <span className="rounded-md border border-dashed border-mist-300 px-2 py-1 font-display text-[12.5px] font-bold tracking-wider text-navy-900">
              {offer.code}
            </span>
          ) : (
            <span />
          )}
          <span aria-hidden="true" className="text-[14px] font-semibold text-brand-700">
            {viewLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

export { OfferCard };
