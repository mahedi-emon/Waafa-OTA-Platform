import { getTranslations } from "next-intl/server";
import { contactPhones } from "@waafa/shared";
import { routing } from "@/i18n/routing";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { listFlightRoutes, listPackages } from "@/lib/data/travel";
import { listVisaCountries, listVisaGuides } from "@/lib/data/visa";
import { isIndexable } from "@/lib/seo/indexing";
import { absoluteUrl } from "@/lib/siteUrl";

/** "+8801823232241" → "+880 1823-232241" */
function international(e164: string): string {
  const national = e164.replace(/^\+880/, "");
  return national.length === 10 ? `+880 ${national.slice(0, 4)}-${national.slice(4)}` : e164;
}

/**
 * /llms.txt (issue 184): a plain summary for AI search engines and assistants (llmstxt.org), built from admin data:
 * who WAAFA is under every brand name, the services with their pages, the visa countries, guides, packages and
 * routes that are indexed, and how to reach the office. No prices: a travel expert confirms them.
 */
export async function GET() {
  const [site, contact, t, tm, countries, guides, { items: packages }, routes] = await Promise.all([
    getSiteSettings(),
    getContactSettings(),
    getTranslations({ locale: routing.defaultLocale, namespace: "Llms" }),
    getTranslations({ locale: routing.defaultLocale, namespace: "Metadata" }),
    listVisaCountries(),
    listVisaGuides(),
    listPackages({ limit: 100 }),
    listFlightRoutes(),
  ]);
  const link = (label: string, path: string) => `- [${label}](${absoluteUrl(path)})`;
  const section = (title: string, items: string[]) =>
    items.length > 0 ? ["", `## ${title}`, "", ...items] : [];
  const names = [site.companyName, site.storeName, "WAAFA"].filter(
    (name, index, all) => name !== site.travelBrand && all.indexOf(name) === index,
  );

  const lines = [
    `# ${site.travelBrand}`,
    "",
    `> ${site.defaultSeo.description ?? tm("description")}`,
    "",
    t("intro", {
      brand: site.travelBrand,
      city: contact.city,
      country: contact.country,
      names: names.join(", "),
    }),
    ...section(t("services"), [
      link(tm("services.flights"), "/flights"),
      link(tm("services.hotels"), "/hotels"),
      link(tm("services.packages"), "/tour-packages"),
      link(tm("services.visa"), "/visa"),
      link(t("store", { store: site.storeName }), "/shop"),
    ]),
    ...section(
      t("visa"),
      countries
        .filter(isIndexable)
        .map((country) => link(t("visaLink", { country: country.name }), `/visa/${country.slug}`)),
    ),
    ...section(
      t("guides"),
      guides.filter(isIndexable).map((guide) => link(guide.title, `/visa-guide/${guide.slug}`)),
    ),
    ...section(
      t("packages"),
      packages.filter(isIndexable).map((pkg) => link(pkg.title, `/tour-packages/${pkg.slug}`)),
    ),
    ...section(
      t("routes"),
      routes.filter(isIndexable).map((route) => link(route.title, `/flights/${route.slug}`)),
    ),
    ...section(t("contact"), [
      `- ${t("phone")}: ${contactPhones(contact)
        .map((phone) => international(phone.e164))
        .join(", ")}`,
      `- ${t("whatsapp")}: ${international(contact.whatsappE164)}`,
      `- ${t("email")}: ${contact.email}`,
      `- ${t("office")}: ${[...contact.addressLines, contact.city, contact.country].join(", ")}`,
      `- ${t("hours")}: ${contact.officeHoursText}. ${contact.closedText}.`,
      link(t("contactPage"), "/contact"),
    ]),
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
