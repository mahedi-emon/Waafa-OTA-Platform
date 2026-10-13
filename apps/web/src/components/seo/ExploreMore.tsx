import { getTranslations } from "next-intl/server";
import { listBlogPosts } from "@/lib/data/content";
import { listFlightRoutes, listPackages } from "@/lib/data/travel";
import { listVisaCountries, listVisaGuides } from "@/lib/data/visa";
import { LinkPill } from "./LinkPill";

export type ExploreGroup = "visa" | "packages" | "routes" | "guides" | "blog";

type ExploreMoreProps = {
  /** The link groups to show, in order; a group with nothing to link is left out. */
  groups: ExploreGroup[];
  /** The current page's path, never linked to itself. */
  exclude?: string;
};

/** Links per group: six from 768 px, four on phones (the rest stay in the page for crawlers). */
const PER_GROUP = 6;

/**
 * "Explore more" (issue 173): links from a page to the site's main content, so visitors and search engines move on to
 * visa countries, tour packages, flight routes, visa guides and articles. Every link comes from Admin records
 * (popular first); the group names are UI strings.
 */
async function ExploreMore({ groups, exclude }: ExploreMoreProps) {
  const t = await getTranslations("Explore");
  const load: Record<ExploreGroup, () => Promise<Array<{ href: string; label: string }>>> = {
    visa: async () =>
      [...(await listVisaCountries())]
        .sort((a, b) => Number(b.popular) - Number(a.popular))
        .map((country) => ({
          href: `/visa/${country.slug}`,
          label: t("visaFor", { country: country.name }),
        })),
    packages: async () =>
      (await listPackages({ sort: "popular", limit: PER_GROUP + 1 })).items.map((pkg) => ({
        href: `/tour-packages/${pkg.slug}`,
        label: pkg.title,
      })),
    routes: async () =>
      [...(await listFlightRoutes())]
        .sort((a, b) => Number(b.popular) - Number(a.popular))
        .map((route) => ({ href: `/flights/${route.slug}`, label: route.title })),
    guides: async () =>
      (await listVisaGuides()).map((guide) => ({
        href: `/visa-guide/${guide.slug}`,
        label: guide.title,
      })),
    blog: async () =>
      (await listBlogPosts({ limit: PER_GROUP + 1 })).items.map((post) => ({
        href: `/blog/${post.slug}`,
        label: post.title,
      })),
  };
  const filled = (
    await Promise.all(
      groups.map(async (group) => ({
        group,
        links: (await load[group]()).filter((link) => link.href !== exclude).slice(0, PER_GROUP),
      })),
    )
  ).filter((entry) => entry.links.length > 0);
  if (filled.length === 0) return null;

  return (
    <nav
      aria-labelledby="explore-more"
      className="flex flex-col gap-5 border-t border-mist-200 pt-8"
    >
      <h2 id="explore-more" className="font-display text-[20px] font-bold text-navy-900">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-10">
        {filled.map(({ group, links }) => (
          <section key={group} aria-labelledby={`explore-${group}`} className="flex flex-col gap-3">
            <h3 id={`explore-${group}`} className="type-label text-mist-600">
              {t(`groups.${group}`)}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.href} className="max-w-full max-md:nth-[n+5]:hidden">
                  <LinkPill href={link.href}>{link.label}</LinkPill>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

export { ExploreMore };
