import { JsonLd } from "@/components/seo/JsonLd";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { defaultShareImage } from "@/lib/seo/withSocial";
import { absoluteUrl } from "@/lib/siteUrl";

/** 600 → "10:00" */
function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * WebSite, Organization and TravelAgency + LocalBusiness for Home (FR-SEO, #96), built only from admin settings: the
 * site name Google shows, the logo, the office with hours, phone, map and the share photo.
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
            "@id": `${url}#website`,
            url,
            name: site.travelBrand,
            alternateName: ["WAAFA", site.storeName],
            inLanguage: "en-BD",
            publisher: { "@id": `${url}#organization` },
          },
          {
            "@type": "Organization",
            "@id": `${url}#organization`,
            name: site.companyName,
            url,
            logo: absoluteUrl("/icon.png"),
            sameAs: contact.socials.map((social) => social.url),
          },
          {
            "@type": ["TravelAgency", "LocalBusiness"],
            "@id": `${url}#agency`,
            name: site.travelBrand,
            url,
            telephone: contact.phoneE164,
            email: contact.email,
            logo: absoluteUrl("/icon.png"),
            ...(image ? { image: absoluteUrl(image.url) } : {}),
            ...(contact.mapUrl ? { hasMap: contact.mapUrl } : {}),
            priceRange: "৳৳",
            currenciesAccepted: "BDT",
            areaServed: { "@type": "Country", name: "Bangladesh" },
            address,
            openingHoursSpecification: hours,
            parentOrganization: { "@id": `${url}#organization` },
          },
        ],
      }}
    />
  );
}

export { HomeJsonLd };
