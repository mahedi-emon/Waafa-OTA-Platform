import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Canonical } from "@/components/seo/Canonical";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/data/settings";
import { listCategories } from "@/lib/data/shop";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Shop.list");
  return { title: t("categoriesTitle"), description: t("categoriesLead") };
}

/** /shop/categories (ShopCats, ShopCats-m, ShopCats-m-printers): top-level categories with their children. */
export default async function CategoriesPage() {
  const [categories, site, t] = await Promise.all([
    listCategories(),
    getSiteSettings(),
    getTranslations("Shop.list"),
  ]);
  const top = categories.filter((category) => category.level === 1);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Canonical path="/shop/categories" />
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: t("categoriesTitle") }]}
        title={t("categoriesTitle")}
        lead={t("categoriesLead")}
      />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((category) => {
          const children = categories.filter((item) => item.parentId === category.id);
          return (
            <li
              key={category.id}
              className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
            >
              <Link
                href={`/shop/c/${category.slug}`}
                className="flex min-h-11 items-center gap-3 outline-none focus-visible:underline"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-electric-50 text-brand-700">
                  <MenuIcon name={category.icon} className="size-5" />
                </span>
                <span className="font-display text-[18px] font-bold text-navy-900">
                  {category.name}
                </span>
              </Link>
              {category.description ? (
                <p className="text-[14px] text-mist-700">{category.description}</p>
              ) : null}
              {children.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/shop/c/${child.slug}`}
                        className="inline-flex min-h-11 items-center rounded-full bg-mist-50 px-3.5 text-[14px] font-medium text-ink-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
