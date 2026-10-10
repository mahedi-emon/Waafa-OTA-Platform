import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { ListingSkeleton } from "@/components/shop/ListingSkeleton";
import { ProductListing } from "@/components/shop/ProductListing";
import { getSiteSettings } from "@/lib/data/settings";
import { getCollection, listCollections } from "@/lib/data/shop";

export async function generateStaticParams() {
  const collections = await listCollections();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/collection/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [collection, t] = await Promise.all([getCollection(slug), getTranslations("Shop.list")]);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description ?? t("collectionMeta", { name: collection.name }),
    alternates: { canonical: `/shop/collection/${collection.slug}` },
  };
}

async function CollectionContent({
  params,
  searchParams,
}: PageProps<"/[locale]/shop/collection/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const [site, t] = await Promise.all([getSiteSettings(), getTranslations("Shop.list")]);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: collection.name }]}
        title={collection.name}
        lead={collection.description ?? t("categoryLead")}
      />
      <ProductListing
        base={{ collection: collection.slug }}
        params={query}
        path={`/shop/collection/${collection.slug}`}
      />
    </main>
  );
}

/** /shop/collection/[slug]: a hand-picked or rule-based collection (FR-CAT-04). */
export default function CollectionPage(props: PageProps<"/[locale]/shop/collection/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CollectionContent {...props} />
    </Suspense>
  );
}
