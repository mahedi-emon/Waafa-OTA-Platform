import { JsonLd } from "@/components/seo/JsonLd";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { absoluteUrl } from "@/lib/siteUrl";

/** 600 → "10:00" */
function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Organization, TravelAgency and LocalBusiness for Home (FR-SEO), built only from admin settings. */
async function HomeJsonLd() {
  const [site, contact] = await Promise.all([getSiteSettings(), getContactSettings()]);
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
