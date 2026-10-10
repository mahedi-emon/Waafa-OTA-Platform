import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Printer } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { ListingSkeleton } from "@/components/shop/ListingSkeleton";
import { ProductListing } from "@/components/shop/ProductListing";
import { Link } from "@/i18n/navigation";
import { getShopContent, getSiteSettings } from "@/lib/data/settings";
import { getAttributeSet, getCategory, listCategories } from "@/lib/data/shop";

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [category, t] = await Promise.all([getCategory(slug), getTranslations("Shop.list")]);
  if (!category) return {};
  return {
    title: category.seo.title ?? category.name,
    description:
      category.seo.description ??
      category.description ??
      t("categoryMeta", { category: category.name }),
    alternates: { canonical: `/shop/c/${category.slug}` },
    ...(category.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

async function CategoryContent({ params, searchParams }: PageProps<"/[locale]/shop/c/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  const [categories, site, content, t] = await Promise.all([
    listCategories(),
    getSiteSettings(),
    getShopContent(),
    getTranslations("Shop"),
  ]);
  const set = category.attributeSetId ? await getAttributeSet(category.attributeSetId) : null;
  const attributes = (set?.attributes ?? []).filter(
    (attribute) =>
      attribute.filterable && attribute.type === "select" && (attribute.options?.length ?? 0) > 0,
  );
  const trail = [];
  for (let parent = categories.find((item) => item.id === category.parentId); parent;) {
    trail.unshift({ label: parent.name, href: `/shop/c/${parent.slug}` });
    const next = parent.parentId;
    parent = categories.find((item) => item.id === next);
  }
  const children = categories.filter((item) => item.parentId === category.id);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, ...trail, { label: category.name }]}
        title={category.name}
        lead={category.description ?? t("list.categoryLead")}
      >
        {children.length > 0 ? (
          <nav aria-label={t("list.subcategories")}>
            <ul className="flex flex-wrap gap-2">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/shop/c/${child.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-mist-200 bg-white px-4 text-[14px] font-semibold text-ink-900 outline-none hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {category.compatibility ? (
          <Link
            href="/shop/finder"
            className="group flex items-center gap-3 rounded-2xl bg-navy-900 p-4 text-white outline-none focus-visible:ring-3 focus-visible:ring-cyan-400/60 sm:max-w-xl"
          >
            <Printer aria-hidden="true" className="size-6 shrink-0 text-cyan-400" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{content.finderStrip.title}</span>
              <span className="block text-[13.5px] text-white/80">{t("list.finderBody")}</span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ) : null}
      </ListingHeader>
      <ProductListing
        base={{ category: category.slug }}
        params={query}
        path={`/shop/c/${category.slug}`}
        attributes={attributes}
      />
    </main>
  );
}

/** /shop/c/[slug] (ShopList, ShopList-printers, ShopList-m, ShopList-m-filters, ShopList-m-fashion). */
export default function CategoryPage(props: PageProps<"/[locale]/shop/c/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}
