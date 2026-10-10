import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { ListingSkeleton } from "@/components/shop/ListingSkeleton";
import { ProductListing } from "@/components/shop/ProductListing";
import { getSiteSettings } from "@/lib/data/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Shop.list");
  return { title: t("searchEmptyTitle"), robots: { index: false } };
}

async function SearchContent({
  searchParams,
}: Pick<PageProps<"/[locale]/shop/search">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const [site, t] = await Promise.all([getSiteSettings(), getTranslations("Shop.list")]);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: t("searchEmptyTitle") }]}
        title={q ? t("searchTitle", { query: q }) : t("searchEmptyTitle")}
        lead={t("searchLead")}
      />
      <ProductListing
        base={q ? { search: q } : {}}
        params={params}
        path="/shop/search"
        keep={q ? { q } : {}}
      />
    </main>
  );
}

/** /shop/search (ShopSearch, ShopSearch-m): results for the store search, with the listing filters. */
export default function ShopSearchPage({ searchParams }: PageProps<"/[locale]/shop/search">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
