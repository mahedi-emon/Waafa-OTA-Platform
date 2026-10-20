import {
  FRAME,
  faqList,
  icon,
  itemId,
  keep,
  lines,
  listOrder,
  phone,
  photoAt,
  recordId,
  sample,
  sectionsList,
  seoAt,
  tags,
  textarea,
  videoAt,
} from "./common";
import type { Blueprint } from "./types";

/* Content: pages, service pages, page blocks, blog, FAQs, gallery, team, baggage rules, EMI banks, media slots. */

export const pagesBlueprint = {
  key: "pages",
  sections: [
    { id: "page", fields: ["title", "slug", "summary", "highlights"] },
    { id: "content", fields: ["sections"] },
    { id: "seo", fields: ["seo"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/" },
    summary: textarea,
    highlights: lines,
    ...sectionsList,
    lastUpdated: { auto: "todayOnSave" },
    ...seoAt(),
    ...sample,
  },
  url: "/{slug}",
  publish: ["sections"],
} satisfies Blueprint;

export const servicePagesBlueprint = {
  key: "servicePages",
  sections: [
    { id: "intro", fields: ["key", "kicker", "title", "lead", "primaryCta", "whatsappMessage"] },
    { id: "facts", fields: ["facts"] },
    { id: "services", fields: ["servicesTitle", "services"] },
    { id: "steps", fields: ["stepsTitle", "steps"] },
    { id: "form", fields: ["formTitle", "formLead", "headerSlot", "formSlot"] },
    { id: "questions", fields: ["questions"] },
    { id: "seo", fields: ["seo"] },
  ],
  fields: {
    key: { widget: "readOnly", choices: "servicePage" },
    lead: textarea,
    whatsappMessage: textarea,
    facts: { widget: "repeater", summary: "value", wide: true },
    services: { widget: "repeater", summary: "title", wide: true },
    services_body: textarea,
    steps: { widget: "repeater", summary: "title", wide: true },
    formLead: textarea,
    headerSlot: { choices: "mediaSlot" },
    formSlot: { choices: "mediaSlot" },
    ...faqList("questions"),
    ...seoAt(),
    ...sample,
  },
  url: { printing: "/shop/printing-solutions", trading: "/shop/international-trading" },
} satisfies Blueprint;

export const pageBlocksBlueprint = {
  key: "pageBlocks",
  sections: [
    { id: "block", fields: ["page", "group", "icon", "title", "body", "tone"] },
    { id: "link", fields: ["link"] },
  ],
  fields: {
    id: recordId,
    page: { choices: "blockPage" },
    icon,
    body: textarea,
    tone: { choices: "tone" },
    link: { wide: true },
    order: listOrder,
    ...sample,
  },
} satisfies Blueprint;

export const blogCategoriesBlueprint = {
  key: "blogCategories",
  sections: [{ id: "category", fields: ["name", "slug"] }],
  fields: { slug: { widget: "slug", source: "name" } },
  url: "/blog",
} satisfies Blueprint;

export const blogPostsBlueprint = {
  key: "blogPosts",
  sections: [
    { id: "post", fields: ["title", "slug", "category", "author", "excerpt", "intro"] },
    { id: "photo", fields: ["cover"] },
    { id: "content", fields: ["sections", "cta"] },
    { id: "seo", fields: ["seo"] },
  ],
  visibility: ["featured"],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/blog/" },
    category: { widget: "reference", ref: { key: "blogCategories", value: "slug" } },
    excerpt: textarea,
    intro: textarea,
    ...photoAt("cover", { ...FRAME.card, minWidth: 1600 }),
    ...sectionsList,
    cta: { choices: "blogCta" },
    publishedAt: { auto: "today" },
    readingMinutes: { auto: "readingMinutes" },
    ...seoAt(),
    ...sample,
  },
  url: "/blog/{slug}",
  publish: ["cover_src", "sections"],
} satisfies Blueprint;

export const faqsBlueprint = {
  key: "faqs",
  sections: [
    { id: "question", fields: ["category", "question", "answer"] },
    { id: "link", fields: ["link"] },
  ],
  visibility: ["onHome"],
  fields: {
    id: recordId,
    category: { choices: "faqCategory" },
    answer: textarea,
    link: { wide: true },
    order: listOrder,
    ...sample,
  },
  url: "/faqs",
} satisfies Blueprint;

export const galleryAlbumsBlueprint = {
  key: "galleryAlbums",
  sections: [
    { id: "album", fields: ["title", "slug", "category"] },
    { id: "photos", fields: ["cover", "items"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/gallery/" },
    category: { choices: "galleryCategory" },
    ...photoAt("cover", FRAME.landscape),
    items: { widget: "repeater", summary: "caption", wide: true },
    items_id: itemId,
    items_kind: { choices: "galleryItemKind" },
    items_provider: { choices: "videoProvider" },
    ...photoAt("items_image", FRAME.free),
    ...photoAt("items_poster", FRAME.poster),
    publishedAt: { auto: "today" },
    ...sample,
  },
  url: "/gallery/{slug}",
  publish: ["cover_src", "items"],
} satisfies Blueprint;

export const teamBlueprint = {
  key: "team",
  sections: [
    { id: "person", fields: ["name", "initials", "designation", "department", "bio"] },
    { id: "photo", fields: ["photo"] },
    { id: "contact", fields: ["whatsappE164", "email", "linkedinUrl"] },
  ],
  visibility: ["visible", "showOnHome", "showOnAbout", "featured"],
  fields: {
    id: recordId,
    bio: textarea,
    ...photoAt("photo", FRAME.person),
    whatsappE164: phone,
    order: listOrder,
    ...sample,
  },
  url: "/about-us",
} satisfies Blueprint;

export const baggageRulesBlueprint = {
  key: "baggageRules",
  sections: [
    { id: "rule", fields: ["airlineCode", "scope", "cabinClass"] },
    { id: "allowance", fields: ["cabinAllowance", "checkedAllowance", "notes", "lastVerified"] },
  ],
  fields: {
    id: recordId,
    airlineCode: {
      widget: "reference",
      ref: { key: "airlines", value: "code", fill: { airlineName: "title" } },
    },
    airlineName: keep,
    scope: { choices: "flightScope" },
    cabinClass: { choices: "cabin" },
    notes: textarea,
    ...sample,
  },
  heading: "{airlineName} · {cabinClass}",
  url: "/baggage-information",
} satisfies Blueprint;

export const emiBanksBlueprint = {
  key: "emiBanks",
  sections: [{ id: "bank", fields: ["name", "tenuresMonths", "note"] }],
  fields: { id: recordId, tenuresMonths: tags, note: textarea, ...sample },
  url: "/emi",
} satisfies Blueprint;

export const mediaSlotsBlueprint = {
  key: "mediaSlots",
  sections: [
    { id: "slot", fields: ["key"] },
    { id: "media", fields: ["image", "video"] },
  ],
  fields: {
    key: { widget: "readOnly", choices: "mediaSlot" },
    ...photoAt("image", FRAME.free),
    ...videoAt("video"),
    ...sample,
  },
} satisfies Blueprint;
