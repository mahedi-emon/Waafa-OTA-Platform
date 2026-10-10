import { formatTaka, type Product } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { Link } from "@/i18n/navigation";

type ProductCardProps = {
  product: Product;
  brandName?: string;
  /** "Save ৳1,200", already formatted by the caller (shown only with a higher MRP). */
  saveLabel?: (amount: string) => string;
  sizes?: string;
};

/**
 * Waafas World product card (DESIGN.md "Cards"): image on mist-50, brand, two-line title, price, struck MRP and a
 * labelled saving. Add to cart and the stepper arrive with the cart (A14); the card links to the product page.
 */
function ProductCard({
  product,
  brandName,
  saveLabel,
  sizes = "(min-width: 1024px) 220px, 45vw",
}: ProductCardProps) {
  const variant =
    product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];
  const image = variant?.images[0] ?? product.images[0];
  const price = variant?.price ?? 0;
  const mrp = variant?.mrp && variant.mrp > price ? variant.mrp : undefined;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white transition-shadow duration-200 hover:shadow-md">
      {image ? (
        <SmartImage
          src={image.src}
          alt={image.alt}
          ratio="1/1"
          sizes={sizes}
          frameClassName="bg-mist-50"
          className="object-contain p-4"
          zoomOnHover
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {brandName ? <p className="text-[12px] font-semibold text-mist-600">{brandName}</p> : null}
        <h3 className="line-clamp-2 text-[14.5px] leading-snug font-semibold text-ink-900">
          <Link
            href={`/shop/p/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {product.title}
          </Link>
        </h3>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1.5">
          <span className="font-display text-[17px] font-extrabold text-navy-900 tabular-nums">
            {formatTaka(price)}
          </span>
          {mrp ? (
            <>
              <s className="text-[12.5px] text-mist-500 tabular-nums">{formatTaka(mrp)}</s>
              {saveLabel ? (
                <span className="text-[12.5px] font-semibold text-success-600">
                  {saveLabel(formatTaka(mrp - price))}
                </span>
              ) : null}
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}

export { ProductCard };
