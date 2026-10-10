import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { ListingSkeleton } from "@/components/shop/ListingSkeleton";
import { ProductListing } from "@/components/shop/ProductListing";
import { getSiteSettings } from "@/lib/data/settings";
import { getBrand, listBrands } from "@/lib/data/shop";

export async function generateStaticParams() {
  const brands = await listBrands();
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/brand/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [brand, t] = await Promise.all([getBrand(slug), getTranslations("Shop.list")]);
  if (!brand) return {};
  return {
    title: brand.name,
    description: brand.description ?? t("brandLead", { brand: brand.name }),
    alternates: { canonical: `/shop/brand/${brand.slug}` },
  };
}

async function BrandContent({ params, searchParams }: PageProps<"/[locale]/shop/brand/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const [site, t] = await Promise.all([getSiteSettings(), getTranslations("Shop.list")]);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: brand.name }]}
        title={t("brandTitle", { brand: brand.name })}
        lead={brand.description ?? t("brandLead", { brand: brand.name })}
      />
      <ProductListing
        base={{ brand: brand.slug }}
        params={query}
        path={`/shop/brand/${brand.slug}`}
      />
    </main>
  );
}

/** /shop/brand/[slug]: every product of one brand, with the listing filters. */
export default function BrandPage(props: PageProps<"/[locale]/shop/brand/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <BrandContent {...props} />
    </Suspense>
  );
}
