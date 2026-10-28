import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { DealCountdown } from "@/components/shop/DealCountdown";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { ListingSkeleton } from "@/components/shop/ListingSkeleton";
import { ProductCard } from "@/components/shop/ProductCard";
import { getSiteSettings } from "@/lib/data/settings";
import { getCampaign, listCampaigns } from "@/lib/data/shop";
import { brandNames, campaignProducts } from "@/lib/shop/catalogue";
import { withSocial } from "@/lib/seo/withSocial";

export async function generateStaticParams() {
  const campaigns = await listCampaigns();
  return campaigns.map((campaign) => ({ slug: campaign.slug }));
}

/** The time of this request (the page waits for the request before it reads the clock). */
async function requestTime(): Promise<number> {
  await connection();
  return Date.now();
}

/** Started, and not ended. Read at request time on the page (the countdown ticks on the client). */
const isLive = (campaign: { startsAt: string; endsAt?: string }, now: number) =>
  Date.parse(campaign.startsAt) <= now &&
  (campaign.endsAt === undefined || Date.parse(campaign.endsAt) > now);

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/campaign/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return {};
  return withSocial({
    title: campaign.title,
    ...(campaign.intro ? { description: campaign.intro } : {}),
    alternates: { canonical: `/shop/campaign/${campaign.slug}` },
    ...(campaign.image ? { image: campaign.image } : {}),
  });
}

async function CampaignContent({
  params,
}: Pick<PageProps<"/[locale]/shop/campaign/[slug]">, "params">) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();
  const [site, products, names, t, tc] = await Promise.all([
    getSiteSettings(),
    campaignProducts(campaign.productIds),
    brandNames(),
    getTranslations("Shop.campaign"),
    getTranslations("Shop.countdown"),
  ]);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: campaign.title }]}
        title={campaign.title}
        lead={campaign.intro ?? t("lead")}
      />
      {campaign.image ? (
        <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-mist-50">
          <SmartImage
            src={campaign.image.src}
            alt={campaign.image.alt}
            focal={campaign.image.focal}
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}
      {/* Its own boundary: only this strip waits for the request time; the rest of the page is prerendered. */}
      <Suspense fallback={<div className="h-12 rounded-2xl bg-navy-900" />}>
        <CampaignWindow
          startsAt={campaign.startsAt}
          {...(campaign.endsAt ? { endsAt: campaign.endsAt } : {})}
          labels={{
            days: tc("days"),
            hours: tc("hours"),
            minutes: tc("minutes"),
            seconds: tc("seconds"),
            ended: tc("ended"),
            label: tc("label"),
          }}
          words={{
            ends: campaign.endsAt ? t("ends", { date: formatDate(campaign.endsAt) }) : t("open"),
            notYet: t("notYet", { date: formatDate(campaign.startsAt) }),
            over: t("over"),
          }}
        />
      </Suspense>
      <h2 className="font-display text-[20px] font-bold text-navy-900">{t("products")}</h2>
      {products.length === 0 ? (
        <p className="text-[15px] text-mist-700">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} brandName={names.get(product.brandId) ?? ""} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/**
 * Whether the campaign runs now, read when the page is served: before the start the page says when it opens, after
 * the end it says it is over (the products stay, at their normal prices); in between the countdown runs.
 */
async function CampaignWindow({
  startsAt,
  endsAt,
  labels,
  words,
}: {
  startsAt: string;
  endsAt?: string;
  labels: Parameters<typeof DealCountdown>[0]["labels"];
  words: { ends: string; notYet: string; over: string };
}) {
  const now = await requestTime();
  const live = isLive({ startsAt, ...(endsAt ? { endsAt } : {}) }, now);
  const message = live ? words.ends : Date.parse(startsAt) > now ? words.notYet : words.over;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white">
      <p className="text-[14.5px] font-semibold">{message}</p>
      {live && endsAt ? <DealCountdown endsAt={endsAt} labels={labels} /> : null}
    </div>
  );
}

/** /shop/campaign/[slug] (issue 247): an admin-managed campaign page with a banner, a countdown and its products. */
export default function CampaignPage(props: PageProps<"/[locale]/shop/campaign/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CampaignContent params={props.params} />
    </Suspense>
  );
}
