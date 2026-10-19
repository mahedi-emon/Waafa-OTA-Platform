import {
  faqList,
  lines,
  money,
  photoAt,
  recordId,
  sample,
  sectionsList,
  seoAt,
  textarea,
} from "./common";
import type { Blueprint } from "./types";

/* Visa: countries with their visa types and guides (tourist, business, student, medical, transit only). */

export const visaCountriesBlueprint = {
  key: "visaCountries",
  sections: [
    { id: "country", fields: ["name", "slug", "flagCode", "region", "submission"] },
    { id: "photo", fields: ["cover"] },
    { id: "types", fields: ["types"] },
    { id: "forms", fields: ["forms", "faqs", "guideSlug"] },
    { id: "seo", fields: ["seo"] },
  ],
  visibility: ["popular"],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/visa/", source: "name" },
    region: { choices: "region" },
    submission: { choices: "submission" },
    ...photoAt("cover"),
    types: { widget: "repeater", summary: "type", wide: true },
    types_type: { choices: "visaType" },
    types_checklist: { widget: "repeater", summary: "title", wide: true },
    types_checklist_detail: textarea,
    types_embassyFee: money,
    types_serviceCharge: money,
    types_priceRange: { wide: true },
    types_priceRange_min: money,
    types_priceRange_max: money,
    types_notes: lines,
    forms: { widget: "repeater", summary: "label", wide: true },
    ...faqList("faqs"),
    guideSlug: { widget: "reference", ref: { key: "visaGuides", value: "slug" } },
    ...seoAt(),
    ...sample,
  },
  url: "/visa/{slug}",
  publish: ["types"],
} satisfies Blueprint;

export const visaGuidesBlueprint = {
  key: "visaGuides",
  sections: [
    { id: "guide", fields: ["title", "slug", "countrySlug", "summary"] },
    { id: "photo", fields: ["cover"] },
    { id: "content", fields: ["sections", "tips"] },
    { id: "seo", fields: ["seo"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/visa-guide/" },
    countrySlug: { widget: "reference", ref: { key: "visaCountries", value: "slug" } },
    summary: textarea,
    ...photoAt("cover"),
    ...sectionsList,
    tips: lines,
    updatedAt: { auto: "todayOnSave" },
    readingMinutes: { auto: "readingMinutes" },
    ...seoAt(),
    ...sample,
  },
  url: "/visa-guide/{slug}",
  publish: ["cover_src", "sections"],
} satisfies Blueprint;
