import { getTranslations } from "next-intl/server";
import { formatTaka, type Product } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { Link } from "@/i18n/navigation";
import { MAX_LINE_QTY } from "@/lib/shop/cart";
import { canBuy, defaultVariant, priceInfo, priceRange, stockBadge } from "@/lib/shop/variants";
import { AddToCartControl } from "./AddToCartControl";
import { StockBadge } from "./StockBadge";

type ProductCardProps = {
  product: Product;
  brandName?: string;
  sizes?: string;
};

/**
 * Waafas World product card (FR-SHOP-03, DESIGN.md "Cards"): image on mist-50, percent-off and badge chips, brand,
 * two-line title, price against MRP, stock badge, and Add to cart (a stepper once added) or Choose options.
 */
async function ProductCard({
  product,
  brandName,
  sizes = "(min-width: 1024px) 220px, 45vw",
}: ProductCardProps) {
  const t = await getTranslations("Shop");
  const variant = defaultVariant(product);
  const image = variant.images[0] ?? product.images[0];
  const hasOptions = product.options.length > 0;
  const range = priceRange(product);
  const price = priceInfo(variant);
  const stock = stockBadge(variant);
  const badge = product.badges[0];
  const href = `/shop/p/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white transition-shadow duration-200 hover:shadow-md">
      <div className="relative">
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
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {price.percentOff > 0 && !hasOptions ? (
            <span className="rounded-full bg-danger-600 px-2 py-0.5 text-[11.5px] font-bold text-white tabular-nums">
              {t("card.off", { percent: price.percentOff })}
            </span>
          ) : null}
          {badge ? (
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11.5px] font-semibold text-navy-900 shadow-xs">
              {t(`badges.${badge}`)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {brandName ? <p className="text-[12px] font-semibold text-mist-600">{brandName}</p> : null}
        <h3 className="line-clamp-2 text-[14.5px] leading-snug font-semibold text-ink-900">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {product.title}
          </Link>
        </h3>
        {product.cardSpec ? (
          <p className="line-clamp-1 text-[12.5px] text-mist-600">{product.cardSpec}</p>
        ) : null}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1.5">
          <span className="font-display text-[17px] font-extrabold text-navy-900 tabular-nums">
            {hasOptions && range.min !== range.max
              ? t("card.from", { price: formatTaka(range.min) })
              : formatTaka(price.price)}
          </span>
          {!hasOptions && price.mrp ? (
            <>
              <s className="text-[12.5px] text-mist-500 tabular-nums">{formatTaka(price.mrp)}</s>
              <span className="text-[12.5px] font-semibold text-success-600">
                {t("card.save", { amount: formatTaka(price.save) })}
              </span>
            </>
          ) : null}
        </p>
        {!hasOptions && stock !== "in-stock" ? (
          <StockBadge
            kind={stock}
            label={t(`stock.${stock}`, { count: variant.stock })}
            className="self-start"
          />
        ) : null}
        <div className="pt-2">
          {hasOptions ? (
            <span
              aria-hidden="true"
              className="inline-flex h-[38px] w-full items-center justify-center rounded-full bg-electric-50 text-sm font-semibold text-brand-700"
            >
              {t("card.choose")}
            </span>
          ) : canBuy(variant) ? (
            <AddToCartControl
              line={{
                productId: product.id,
                variantId: variant.id,
                slug: product.slug,
                title: product.title,
                variantLabel: "",
                sku: variant.sku,
                ...(image ? { image: { src: image.src, alt: image.alt } } : {}),
                price: variant.price,
                maxQty: variant.stock > 0 ? variant.stock : MAX_LINE_QTY,
              }}
              labels={{
                add: t("card.add"),
                addLabel: t("card.addLabel", { title: product.shortTitle }),
                decrease: t("card.decrease", { title: product.shortTitle }),
                increase: t("card.increase", { title: product.shortTitle }),
                added: t("card.added"),
              }}
            />
          ) : (
            <span className="inline-flex h-[38px] w-full items-center justify-center rounded-full bg-mist-100 text-sm font-semibold text-mist-600">
              {t("card.soldOut")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export { ProductCard };
