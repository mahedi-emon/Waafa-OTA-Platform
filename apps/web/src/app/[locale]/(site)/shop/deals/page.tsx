import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Canonical } from "@/components/seo/Canonical";
import { DealCountdown } from "@/components/shop/DealCountdown";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/data/settings";
import { listDeals } from "@/lib/data/shop";
import { brandNames } from "@/lib/shop/catalogue";
import { withDeals } from "@/lib/shop/deals";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Shop.list");
  return { title: t("dealsTitle"), description: t("dealsLead") };
}

/** /shop/deals (ShopDeals, ShopDeals-m): running deals, ending soonest first, each with its own timer. */
export default async function DealsPage() {
  const [deals, names, site, t, tc] = await Promise.all([
    listDeals(),
    brandNames(),
    getSiteSettings(),
    getTranslations("Shop.list"),
    getTranslations("Shop.countdown"),
  ]);
  const labels = {
    days: tc("days"),
    hours: tc("hours"),
    minutes: tc("minutes"),
    seconds: tc("seconds"),
    ended: tc("ended"),
    label: tc("label"),
  };

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Canonical path="/shop/deals" />
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: t("dealsTitle") }]}
        title={t("dealsTitle")}
        lead={t("dealsLead")}
      />
      {deals.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">
          {deals.map((deal) => (
            <li key={deal.id} className="flex flex-col gap-2">
              <span className="flex flex-col gap-1">
                <span className="text-[12.5px] font-semibold text-mist-600">{t("endsIn")}</span>
                <DealCountdown endsAt={deal.endsAt} labels={labels} />
              </span>
              <ProductCard
                product={withDeals(deal.product, deals)}
                brandName={names.get(deal.product.brandId) ?? ""}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Tag}
          title={tc("ended")}
          description={t("dealsLead")}
          action={
            <Button asChild variant="secondary">
              <Link href="/shop">{site.storeName}</Link>
            </Button>
          }
        />
      )}
    </main>
  );
}
