import type { Metadata } from "next";
import { Canonical } from "@/components/seo/Canonical";
import { getSiteSettings } from "@/lib/data/settings";
import { HomeJsonLd } from "./_components/home/HomeJsonLd";
import { HomeSections } from "./_components/home/HomeSections";

/** Home title and description from Admin › Settings › General › SEO (siteSettings.defaultSeo). */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const title = site.defaultSeo.title ?? site.travelBrand;
  const description = site.defaultSeo.description;
  return {
    title: { absolute: title },
    ...(description ? { description } : {}),
    openGraph: { type: "website", title, ...(description ? { description } : {}) },
  };
}

/** Home (A7): the 13 admin-ordered sections from PRD §7, with the search card in the hero. */
export default function HomePage() {
  return (
    <main id="main" className="pb-24 md:pb-8">
      <Canonical path="/" />
      <HomeSections />
      <HomeJsonLd />
    </main>
  );
}
