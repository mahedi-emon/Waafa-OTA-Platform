import {
  faqList,
  keep,
  lines,
  listOrder,
  money,
  photoAt,
  photoList,
  recordId,
  sample,
  seoAt,
  tags,
  textarea,
  videoAt,
} from "./common";
import type { Blueprint } from "./types";

/* Travel: airports, airlines, group fares, flight routes, tour packages, hotel places. */

export const airportsBlueprint = {
  key: "airports",
  sections: [
    { id: "airport", fields: ["iata", "city", "name", "country", "countryCode", "pinnedRank"] },
  ],
} satisfies Blueprint;

export const airlinesBlueprint = {
  key: "airlines",
  sections: [
    { id: "airline", fields: ["code", "name", "featuredOrder"] },
    { id: "logo", fields: ["logo"] },
  ],
  fields: { ...photoAt("logo") },
} satisfies Blueprint;

export const groupFaresBlueprint = {
  key: "groupFares",
  sections: [
    {
      id: "flight",
      fields: ["airline", "from", "to", "tripType", "departDate", "returnDate", "stops"],
    },
    { id: "seat", fields: ["cabin", "baggage", "farePerAdult", "seatsLeft", "expiresAt", "notes"] },
  ],
  fields: {
    id: recordId,
    airline: {
      widget: "reference",
      ref: { key: "airlines", embed: { code: "value", name: "title", logo: "image" } },
    },
    from: {
      widget: "reference",
      ref: { key: "airports", embed: { iata: "value", city: "title" } },
    },
    to: { widget: "reference", ref: { key: "airports", embed: { iata: "value", city: "title" } } },
    tripType: { choices: "tripType" },
    cabin: { choices: "cabin" },
    farePerAdult: money,
    notes: textarea,
    ...sample,
  },
  heading: "{from_city} → {to_city} · {airline_name}",
  url: "/flights/group-fares",
} satisfies Blueprint;

export const flightRoutesBlueprint = {
  key: "flightRoutes",
  sections: [
    { id: "route", fields: ["from", "to", "title", "slug", "intro", "flightTime", "airlineCodes"] },
    { id: "photo", fields: ["image"] },
    { id: "price", fields: ["fromPrice", "bestTime"] },
    { id: "tips", fields: ["tips", "faqs"] },
    { id: "visa", fields: ["visaCountrySlug"] },
    { id: "seo", fields: ["seo"] },
  ],
  visibility: ["popular"],
  fields: {
    from: { widget: "reference", ref: { key: "airports", value: "iata" } },
    to: { widget: "reference", ref: { key: "airports", value: "iata" } },
    slug: { widget: "slug", prefix: "/flights/" },
    intro: textarea,
    airlineCodes: { widget: "references", ref: { key: "airlines", value: "code" } },
    ...photoAt("image"),
    fromPrice: money,
    bestTime: textarea,
    tips: { widget: "repeater", summary: "title", wide: true },
    tips_body: textarea,
    ...faqList("faqs"),
    visaCountrySlug: { widget: "reference", ref: { key: "visaCountries", value: "slug" } },
    order: listOrder,
    ...seoAt(),
    ...sample,
  },
  url: "/flights/{slug}",
  publish: ["image_src"],
} satisfies Blueprint;

export const tourPackagesBlueprint = {
  key: "tourPackages",
  sections: [
    {
      id: "basics",
      fields: [
        "title",
        "slug",
        "summary",
        "placesLabel",
        "destinationSlug",
        "countries",
        "categories",
        "tags",
      ],
    },
    {
      id: "trip",
      fields: [
        "durationDays",
        "durationNights",
        "nightsPerCity",
        "groupSize",
        "months",
        "anyDate",
        "departures",
      ],
    },
    { id: "photos", fields: ["cover", "gallery", "video"] },
    { id: "highlights", fields: ["highlights", "includesShort"] },
    { id: "itinerary", fields: ["itinerary"] },
    { id: "prices", fields: ["fromPrice", "prices"] },
    { id: "included", fields: ["inclusions", "exclusions"] },
    { id: "hotels", fields: ["hotels"] },
    { id: "visa", fields: ["visa", "visaNote"] },
    { id: "terms", fields: ["terms", "faqs", "relatedSlugs"] },
    { id: "seo", fields: ["seo"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/tour-packages/" },
    summary: textarea,
    destinationSlug: { widget: "reference", ref: { key: "destinations", value: "slug" } },
    countries: tags,
    categories: { widget: "choices", choices: "packageCategory" },
    tags: { widget: "choices", choices: "packageTag" },
    nightsPerCity: { widget: "repeater", summary: "city", wide: true },
    months: tags,
    departures: { widget: "repeater", summary: "date", wide: true },
    ...photoAt("cover"),
    ...photoList("gallery"),
    ...videoAt("video"),
    highlights: { widget: "repeater", summary: "title", wide: true },
    includesShort: lines,
    itinerary: { widget: "repeater", summary: "title", wide: true },
    itinerary_day: { auto: "dayNumber" },
    itinerary_body: textarea,
    itinerary_tags: tags,
    fromPrice: money,
    prices: { widget: "repeater", summary: "label", wide: true },
    prices_sharing: { choices: "sharing" },
    prices_price: money,
    inclusions: lines,
    exclusions: lines,
    hotels: { widget: "repeater", summary: "city", wide: true },
    ...photoAt("hotels_image"),
    visa: { wide: true },
    visa_body: textarea,
    visa_countrySlug: { widget: "reference", ref: { key: "visaCountries", value: "slug" } },
    terms: lines,
    ...faqList("faqs"),
    relatedSlugs: { widget: "references", ref: { key: "tourPackages", value: "slug" } },
    popularity: keep,
    publishedAt: { auto: "today" },
    ...seoAt(),
    ...sample,
  },
  url: "/tour-packages/{slug}",
  publish: ["cover_src", "itinerary", "prices"],
} satisfies Blueprint;

export const hotelPlacesBlueprint = {
  key: "hotelPlaces",
  sections: [{ id: "place", fields: ["kind", "name", "city", "country"] }],
  visibility: ["popular"],
  fields: { id: recordId, kind: { choices: "hotelPlaceKind" } },
  url: "/hotels",
} satisfies Blueprint;
