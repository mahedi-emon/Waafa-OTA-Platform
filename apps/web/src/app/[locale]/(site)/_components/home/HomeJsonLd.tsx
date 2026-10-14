import { contactPhones } from "@waafa/shared";
import { JsonLd } from "@/components/seo/JsonLd";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { schemaId } from "@/lib/seo/schemaIds";
import { defaultShareImage } from "@/lib/seo/withSocial";
import { absoluteUrl } from "@/lib/siteUrl";

/** 600 → "10:00" */
function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Other names people search for, without the entity's own name or repeats (any letter case). */
function otherNames(name: string, ...names: string[]): string[] {
  const seen = new Set([name.trim().toLowerCase()]);
  return names.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * WebSite, Organization and TravelAgency + LocalBusiness for Home (FR-SEO, #96), built only from admin settings: the
 * site name Google shows, the logo, the office with hours, phone, map and the share photo. Each entity also carries
 * the other brand names (WAAFA, Waafa Tours and Travel, Waafa International, Waafas World) so a search for any of them
 * finds the site (issue 173).
 */
async function HomeJsonLd() {
  const [site, contact, image] = await Promise.all([
    getSiteSettings(),
    getContactSettings(),
    defaultShareImage(),
  ]);
  const url = absoluteUrl("/");
  const address = {
    "@type": "PostalAddress",
    streetAddress: contact.addressLines.join(", "),
    addressLocality: contact.city,
    addressCountry: contact.country,
  };
  const hours = contact.officeHours.days.map((day) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: DAY_NAMES[day],
    opens: clock(contact.officeHours.opensAt),
    closes: clock(contact.officeHours.closesAt),
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": schemaId("website"),
            url,
            name: site.travelBrand,
            alternateName: otherNames(site.travelBrand, "WAAFA", site.companyName, site.storeName),
            inLanguage: "en-BD",
            publisher: { "@id": schemaId("organization") },
          },
          {
            "@type": "Organization",
            "@id": schemaId("organization"),
            name: site.companyName,
            alternateName: otherNames(site.companyName, "WAAFA", site.travelBrand),
            url,
            logo: absoluteUrl("/icon.png"),
            sameAs: contact.socials.map((social) => social.url),
          },
          {
            "@type": ["TravelAgency", "LocalBusiness"],
            "@id": schemaId("agency"),
            name: site.travelBrand,
            alternateName: otherNames(site.travelBrand, "WAAFA", site.companyName),
            url,
            telephone: contactPhones(contact).map((phone) => phone.e164),
            email: contact.email,
            logo: absoluteUrl("/icon.png"),
            ...(image ? { image: absoluteUrl(image.url) } : {}),
            ...(contact.mapUrl ? { hasMap: contact.mapUrl } : {}),
            priceRange: "৳৳",
            currenciesAccepted: "BDT",
            areaServed: { "@type": "Country", name: "Bangladesh" },
            address,
            openingHoursSpecification: hours,
            parentOrganization: { "@id": schemaId("organization") },
          },
        ],
      }}
    />
  );
}

export { HomeJsonLd };
