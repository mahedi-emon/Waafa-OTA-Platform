import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { whatsappLink } from "@waafa/shared";
import { SectionHeading } from "@/components/content/SectionHeading";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartVideo } from "@/components/media/SmartVideo";
import { JsonLd } from "@/components/seo/JsonLd";
import { BulkQuote } from "@/components/shop/BulkQuote";
import { ProductCard } from "@/components/shop/ProductCard";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessages } from "@/i18n/pickMessages";
import {
  getContactSettings,
  getPaymentSettings,
  getShippingSettings,
  getSiteSettings,
} from "@/lib/data/settings";
import { listCategories, listCompatibleModels, getProduct, listProducts } from "@/lib/data/shop";
import { brandNames, pricedProduct, pricedProducts } from "@/lib/shop/catalogue";
import { stockBadge } from "@/lib/shop/variants";
import { absoluteUrl } from "@/lib/siteUrl";
import { ProductView } from "./_components/ProductView";

export async function generateStaticParams() {
  const { items } = await listProducts({ limit: 200 });
  return items.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const title = product.seo.title ?? product.title;
  const description = product.seo.description ?? product.description[0];
  return {
    title,
    ...(description ? { description: description.slice(0, 170) } : {}),
    alternates: { canonical: `/shop/p/${product.slug}` },
    openGraph: {
      title,
      images: product.images.slice(0, 1).map((image) => ({ url: image.src, alt: image.alt })),
    },
    ...(product.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

const AVAILABILITY = {
  "in-stock": "https://schema.org/InStock",
  "low-stock": "https://schema.org/LimitedAvailability",
  "out-of-stock": "https://schema.org/OutOfStock",
  "pre-order": "https://schema.org/PreOrder",
} as const;

async function ProductContent({ params }: Pick<PageProps<"/[locale]/shop/p/[slug]">, "params">) {
  const { slug } = await params;
  const found = await getProduct(slug);
  if (!found) notFound();
  const [product, categories, names, shipping, payment, contact, site, messages, t] =
    await Promise.all([
      pricedProduct(found),
      listCategories(),
      brandNames(),
      getShippingSettings(),
      getPaymentSettings(),
      getContactSettings(),
      getSiteSettings(),
      getMessages(),
      getTranslations("Shop"),
    ]);
  const category = categories.find((item) => item.id === product.categoryId);
  const brand = names.get(product.brandId) ?? "";
  const compatible =
    category?.compatibility && product.compatibleModelIds.length > 0
      ? (await listCompatibleModels())
          .filter((model) => product.compatibleModelIds.includes(model.id))
          .map((model) => `${model.brand} ${model.model}`)
      : [];
  const related = category
    ? (await pricedProducts({ category: category.slug, limit: 6 })).items.filter(
        (item) => item.id !== product.id,
      )
    : [];
  const trail = [];
  for (let parent = category; parent;) {
    trail.unshift({ label: parent.name, href: `/shop/c/${parent.slug}` });
    const next = parent.parentId;
    parent = categories.find((item) => item.id === next);
  }
  const url = absoluteUrl(`/shop/p/${product.slug}`);

  return (
    <main id="main" className="site-container flex flex-col gap-12 pt-4 pb-40 md:pt-6 lg:pb-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description.join(" "),
          image: product.images.map((image) => image.src),
          sku: product.variants[0]?.sku,
          brand: { "@type": "Brand", name: brand },
          ...(category ? { category: category.name } : {}),
          offers: product.variants.map((variant) => ({
            "@type": "Offer",
            sku: variant.sku,
            price: variant.price,
            priceCurrency: "BDT",
            availability: AVAILABILITY[stockBadge(variant)],
            url,
            seller: { "@type": "Organization", name: site.storeName },
          })),
        }}
      />
      <div className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: site.storeName, href: "/shop" },
            ...trail,
            { label: product.shortTitle },
          ]}
        />
        <NextIntlClientProvider messages={pickMessages(messages, ["Shop"])}>
          <ProductView
            product={product}
            brand={brand}
            category={{ name: category?.name ?? "", slug: category?.slug ?? "" }}
            zones={shipping.zones}
            codLimit={payment.codLimit}
            compatible={compatible}
          />
        </NextIntlClientProvider>
      </div>

      {product.highlights.length > 0 ? (
        <section aria-labelledby="product-highlights" className="flex flex-col gap-4">
          <h2 id="product-highlights" className="font-display text-[22px] font-bold text-navy-900">
            {t("product.highlights")}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {product.highlights.map((highlight) => (
              <li
                key={highlight.text}
                className="flex items-center gap-3 rounded-2xl bg-mist-50 p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
                  <MenuIcon name={highlight.icon} className="size-5" />
                </span>
                <span className="text-[14.5px] font-medium text-ink-900">{highlight.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section aria-labelledby="product-description" className="flex flex-col gap-3">
          <h2 id="product-description" className="font-display text-[22px] font-bold text-navy-900">
            {t("product.description")}
          </h2>
          {product.description.map((paragraph) => (
            <p key={paragraph} className="text-[16px] leading-relaxed text-ink-900">
              {paragraph}
            </p>
          ))}
          {product.video ? (
            <figure className="mt-2 flex flex-col gap-2">
              <SmartVideo
                sources={{
                  mp4: product.video.mp4,
                  ...(product.video.webm ? { webm: product.video.webm } : {}),
                  ...(product.video.mp4Mobile ? { mp4Mobile: product.video.mp4Mobile } : {}),
                  ...(product.video.webmMobile ? { webmMobile: product.video.webmMobile } : {}),
                }}
                poster={product.video.poster.src}
                alt={product.video.poster.alt}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="aspect-video overflow-hidden rounded-2xl"
              />
              {product.video.caption ? (
                <figcaption className="text-[13px] text-mist-600">
                  {product.video.caption}
                  {product.video.credit ? ` · ${product.video.credit}` : ""}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </section>
        {product.specs.length > 0 ? (
          <section aria-labelledby="product-specs" className="flex flex-col gap-3">
            <h2 id="product-specs" className="font-display text-[22px] font-bold text-navy-900">
              {t("product.specs")}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
              <table className="w-full text-left text-[15px]">
                <tbody className="divide-y divide-mist-200">
                  {product.specs.map((spec) => (
                    <tr key={spec.label}>
                      <th
                        scope="row"
                        className="w-2/5 bg-mist-50 px-4 py-3 font-semibold text-ink-900"
                      >
                        {spec.label}
                      </th>
                      <td className="px-4 py-3 text-ink-900">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      {product.warranty.items.length > 0 ? (
        <section aria-labelledby="product-warranty" className="flex flex-col gap-4">
          <h2 id="product-warranty" className="font-display text-[22px] font-bold text-navy-900">
            {t("product.warranty")}
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {product.warranty.items.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-2xl border border-mist-200 bg-white p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-electric-50 text-brand-700">
                  <MenuIcon name={item.icon} className="size-5" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-navy-900">
                    {item.title}
                  </span>
                  <span className="block text-[14px] text-mist-700">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {product.bulkFrom ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-navy-900 p-5 text-white">
            <Building2 aria-hidden="true" className="size-6 text-cyan-400" />
            <p>
              <span className="block font-display text-[18px] font-bold">
                {t("product.bulkTitle")}
              </span>
              <span className="block text-[14.5px] text-white/80">
                {t("product.bulkBody", { count: product.bulkFrom })}
              </span>
            </p>
            <BulkQuote
              product={{ title: product.title, slug: product.slug }}
              trigger={
                <Button variant="white" className="self-start">
                  {t("product.bulkCta")}
                </Button>
              }
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5">
          <p>
            <span className="block font-display text-[18px] font-bold text-navy-900">
              {t("product.questionsTitle")}
            </span>
            <span className="block text-[14.5px] text-mist-700">{t("product.questionsBody")}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(
                  contact.whatsappE164,
                  t("product.questionsMessage", { title: product.title }),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-5" />
                {t("product.questionsWhatsapp")}
              </a>
            </Button>
            <a
              href={`tel:${contact.phoneE164}`}
              className="text-[15px] font-semibold text-navy-900 tabular-nums"
            >
              {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="product-related" className="flex flex-col gap-5">
          <SectionHeading
            id="product-related"
            title={t("product.related")}
            {...(category
              ? { action: { href: `/shop/c/${category.slug}`, label: t("product.seeMore") } }
              : {})}
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.slice(0, 5).map((item) => (
              <li key={item.id}>
                <ProductCard product={item} brandName={names.get(item.brandId) ?? ""} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RecentlyViewed
        title={t("product.recentlyViewed")}
        clearLabel={t("home.clear")}
        exclude={product.slug}
      />
    </main>
  );
}

/** /shop/p/[slug] (ShopProduct, -pb, -hp, -toner, -video, -bulk, -m-* boards). */
export default function ProductPage({ params }: PageProps<"/[locale]/shop/p/[slug]">) {
  return (
    <Suspense
      fallback={
        <main
          id="main"
          aria-busy="true"
          className="site-container grid grid-cols-1 gap-8 pt-4 pb-28 md:pt-6 lg:grid-cols-2"
        >
          <Skeleton className="aspect-square rounded-[20px]" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-[320px] rounded-2xl" />
          </div>
        </main>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}
