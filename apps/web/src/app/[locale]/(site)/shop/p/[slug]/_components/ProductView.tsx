"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Expand, Minus, Plus, ShoppingCart, Truck, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "cn";
import { formatTaka, type Product, type ShippingZone } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { StockBadge } from "@/components/shop/StockBadge";
import { useCart } from "@/components/shop/useCart";
import { recordView } from "@/components/shop/useRecentlyViewed";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { MAX_LINE_QTY } from "@/lib/shop/cart";
import {
  canBuy,
  defaultVariant,
  isValueAvailable,
  pickOption,
  priceInfo,
  resolveVariant,
  stockBadge,
  variantImages,
  type Selection,
} from "@/lib/shop/variants";

const PhotoLightbox = dynamic(() =>
  import("@/components/media/PhotoLightbox").then((module) => module.PhotoLightbox),
);

type ProductViewProps = {
  product: Product;
  brand: string;
  category: { name: string; slug: string };
  zones: ShippingZone[];
  codLimit: number;
  /** "Compatible with" models, only when the category uses compatibility. */
  compatible: string[];
};

/**
 * Product top (ShopProduct boards, FR-SHOP-04): gallery that follows the variant, title, stock, SKU, price against
 * MRP with the saving, option selectors that update everything, quantity, Add to cart and Buy now, delivery by zone,
 * cash on delivery, warranty, "Compatible with" and a sticky buy bar on phones.
 */
function ProductView({ product, brand, category, zones, codLimit, compatible }: ProductViewProps) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const { add } = useCart();
  const [selection, setSelection] = useState<Selection>(() => ({
    ...defaultVariant(product).options,
  }));
  const [qty, setQty] = useState(1);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const variant = resolveVariant(product, selection) ?? defaultVariant(product);
  const images = variantImages(product, variant);
  const shown = images[Math.min(photo, images.length - 1)] ?? images[0];
  const price = priceInfo(variant);
  const stock = stockBadge(variant);
  const buyable = canBuy(variant);
  const maxQty = variant.stock > 0 ? Math.min(variant.stock, MAX_LINE_QTY) : MAX_LINE_QTY;
  const zone = zones.find((item) => item.id === zoneId) ?? zones[0];
  const variantLabel = product.options
    .map((option) => selection[option.key])
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    const image = product.images[0];
    recordView({
      slug: product.slug,
      title: product.title,
      brand,
      price: defaultVariant(product).price,
      ...(image ? { image: { src: image.src, alt: image.alt } } : {}),
    });
  }, [product, brand]);

  function addToCart(): boolean {
    if (!buyable) return false;
    add({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      title: product.title,
      variantLabel,
      sku: variant.sku,
      ...(images[0] ? { image: { src: images[0].src, alt: images[0].alt } } : {}),
      price: variant.price,
      qty,
      maxQty,
    });
    return true;
  }

  const buyButtons = (compact: boolean) => (
    <>
      <Button
        type="button"
        size={compact ? "md" : "lg"}
        variant={compact ? "secondary" : "primary"}
        aria-disabled={!buyable}
        onClick={() => {
          if (addToCart()) toast.success(t("card.added"), { description: product.title });
        }}
        className={cn(!compact && "sm:flex-1")}
      >
        <ShoppingCart aria-hidden="true" />
        <span className={cn(compact && "sr-only min-[420px]:not-sr-only")}>{t("product.add")}</span>
      </Button>
      <Button
        type="button"
        size={compact ? "md" : "lg"}
        variant={compact ? "primary" : "navy"}
        aria-disabled={!buyable}
        onClick={() => {
          if (addToCart()) router.push("/shop/cart");
        }}
        className={cn(!compact && "sm:flex-1")}
      >
        {t("product.buyNow")}
      </Button>
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <section
        aria-label={t("product.photos")}
        className="flex flex-col gap-3 lg:sticky lg:top-[calc(var(--hdr-h)+16px)] lg:self-start"
      >
        {shown ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setZoom(photo)}
              aria-label={`${t("product.zoom")}: ${shown.alt}`}
              className="group relative cursor-zoom-in overflow-hidden rounded-[20px] bg-mist-50 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <SmartImage
                key={shown.src}
                src={shown.src}
                alt={shown.alt}
                ratio="1/1"
                preload
                sizes="(min-width: 1024px) 560px, 100vw"
                frameClassName="bg-mist-50"
                className="animate-in object-contain p-6 duration-300 fade-in-0 motion-reduce:animate-none"
              />
              <span
                aria-hidden="true"
                className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-white/90 text-navy-900 shadow-xs"
              >
                <Expand className="size-4" />
              </span>
            </button>
            <span className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
              {price.percentOff > 0 ? (
                <span className="rounded-full bg-danger-600 px-2.5 py-1 text-[12px] font-bold text-white tabular-nums">
                  {t("card.off", { percent: price.percentOff })}
                </span>
              ) : null}
              {product.badges[0] ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-navy-900 shadow-xs">
                  {t(`badges.${product.badges[0]}`)}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
        {images.length > 1 ? (
          <ul className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <li key={image.src} className="shrink-0">
                <button
                  type="button"
                  aria-label={t("product.photo", { n: index + 1, total: images.length })}
                  aria-pressed={index === photo}
                  onClick={() => setPhoto(index)}
                  className={cn(
                    "block size-16 overflow-hidden rounded-xl border-2 bg-mist-50 outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    index === photo ? "border-electric-600" : "border-transparent",
                  )}
                >
                  <SmartImage
                    src={image.src}
                    alt=""
                    ratio="1/1"
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {zoom !== null ? (
        <PhotoLightbox
          images={images}
          title={product.title}
          start={zoom}
          labels={{
            gallery: t("product.photos"),
            previous: t("product.previous"),
            next: t("product.next"),
          }}
          onClose={() => setZoom(null)}
        />
      ) : null}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-[13.5px] font-semibold text-brand-700">
            {brand} ·{" "}
            <Link href={`/shop/c/${category.slug}`} className="underline-offset-4 hover:underline">
              {category.name}
            </Link>
          </p>
          <h1 className="font-display text-[26px] leading-[1.15] font-extrabold tracking-tight text-navy-900 md:text-[32px]">
            {product.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-mist-600">
            <StockBadge kind={stock} label={t(`stock.${stock}`, { count: variant.stock })} />
            <span className="tabular-nums">{t("product.sku", { sku: variant.sku })}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              aria-live="polite"
              className="font-display text-[32px] font-extrabold text-navy-900 tabular-nums"
            >
              {formatTaka(price.price)}
            </span>
            {price.mrp ? (
              <s className="text-[16px] text-mist-500 tabular-nums">{formatTaka(price.mrp)}</s>
            ) : null}
            {product.codEligible ? (
              <span className="rounded-full bg-success-50 px-2.5 py-1 text-[12px] font-semibold text-success-600">
                {t("product.cod")}
              </span>
            ) : null}
          </p>
          <p className="text-[13.5px] text-mist-600">
            {price.save > 0 ? `${t("product.save", { amount: formatTaka(price.save) })} · ` : ""}
            {t("product.vat")}
          </p>
        </div>

        {product.options.map((option) => (
          <fieldset key={option.key} className="flex flex-col gap-2">
            <legend className="mb-2 text-[14px] font-semibold text-ink-900">
              {option.label}:{" "}
              <span className="font-normal text-mist-700">{selection[option.key]}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const selected = selection[option.key] === value.value;
                const available = isValueAvailable(product, selection, option, value.value);
                return (
                  <button
                    key={value.value}
                    type="button"
                    aria-pressed={selected}
                    aria-label={
                      available ? value.value : t("product.optionSoldOut", { value: value.value })
                    }
                    onClick={() => {
                      setSelection((current) =>
                        pickOption(product, current, option.key, value.value),
                      );
                      setPhoto(0);
                      setQty(1);
                    }}
                    className={cn(
                      "relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-[14px] font-medium transition-[border-color,background-color] outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                      selected
                        ? "border-electric-600 bg-electric-50 text-navy-900"
                        : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
                      !available && "text-mist-500 line-through",
                    )}
                  >
                    {option.display === "swatch" && value.swatch ? (
                      <span
                        aria-hidden="true"
                        className="size-5 rounded-full ring-1 ring-mist-300"
                        style={{ backgroundColor: value.swatch }}
                      />
                    ) : null}
                    {option.display === "swatch" ? (
                      <span className="sr-only sm:not-sr-only">{value.value}</span>
                    ) : (
                      value.value
                    )}
                    {selected ? (
                      <Check aria-hidden="true" className="size-3.5 text-electric-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        {compatible.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-ink-900">{t("product.compatible")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {compatible.map((model) => (
                <li
                  key={model}
                  className="rounded-full bg-mist-100 px-3 py-1 text-[13px] text-ink-900"
                >
                  {model}
                </li>
              ))}
            </ul>
            <Link
              href="/shop/finder"
              className="self-start text-[14px] font-semibold text-brand-700 underline underline-offset-4"
            >
              {t("product.compatibleCheck")}
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <div role="group" aria-label={t("product.quantity")} className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-ink-900">{t("product.quantity")}</span>
            <div className="flex items-center gap-1 rounded-full border border-mist-200 p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("product.decrease")}
                aria-disabled={qty <= 1}
                onClick={() => qty > 1 && setQty(qty - 1)}
              >
                <Minus aria-hidden="true" />
              </Button>
              <output
                aria-live="polite"
                className="w-8 text-center font-display text-[16px] font-extrabold text-navy-900 tabular-nums"
              >
                {qty}
              </output>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("product.increase")}
                aria-disabled={qty >= maxQty}
                onClick={() => qty < maxQty && setQty(qty + 1)}
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
          {buyable ? (
            <div className="flex flex-col gap-2 sm:flex-row">{buyButtons(false)}</div>
          ) : (
            <p
              role="status"
              className="rounded-xl bg-mist-100 px-4 py-3 text-[14.5px] font-semibold text-mist-700"
            >
              {t("product.soldOut")}
            </p>
          )}
        </div>

        <ul className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4 text-[14px]">
          {zone ? (
            <li className="flex gap-3">
              <Truck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                  {t("product.deliveryTo")}
                  <select
                    value={zone.id}
                    onChange={(event) => setZoneId(event.target.value)}
                    className="h-9 rounded-lg border border-mist-300 bg-white px-2 text-[14px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    {zones.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="text-mist-700">
                  {t("product.deliveryLine", {
                    charge: formatTaka(zone.charge),
                    estimate: zone.estimate,
                  })}
                </span>
              </div>
            </li>
          ) : null}
          {product.codEligible ? (
            <li className="flex gap-3">
              <Wallet aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <span>
                <span className="block font-semibold text-ink-900">{t("product.codLine")}</span>
                <span className="text-mist-700">
                  {t("product.codLimit", { limit: formatTaka(codLimit) })}
                </span>
              </span>
            </li>
          ) : null}
          <li className="flex gap-3">
            <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-600" />
            <span>
              <span className="block font-semibold text-ink-900">{product.warranty.short}</span>
              <Link
                href="/refund-policy"
                className="text-mist-700 underline-offset-4 hover:underline"
              >
                {t("product.returns", { returns: product.warranty.returnsShort })}
              </Link>
            </span>
          </li>
        </ul>
      </div>

      {buyable ? (
        <div
          data-bottom-bar=""
          className="fixed inset-x-0 bottom-(--tab-space) z-30 border-t border-mist-200 bg-white/95 px-4 py-2.5 shadow-[0_-12px_28px_-22px_rgb(2_13_57/0.35)] backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
            <p className="min-w-0 leading-tight">
              <span className="block font-display text-[18px] font-extrabold text-navy-900 tabular-nums">
                {formatTaka(price.price)}
              </span>
              {variantLabel ? (
                <span className="block truncate text-[12px] text-mist-600">{variantLabel}</span>
              ) : null}
            </p>
            <div className="flex shrink-0 gap-2">{buyButtons(true)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { ProductView };
