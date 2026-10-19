import { icon, keep, lines, listOrder, money, photoAt, recordId, textarea } from "./common";
import type { Blueprint } from "./types";

/* Home: the page's words, its sections, trust items, values, timeline, destinations and banners. */

export const homeContentBlueprint = {
  key: "homeContent",
  sections: [
    { id: "hero", fields: ["hero"] },
    { id: "why", fields: ["why"] },
    { id: "store", fields: ["store"] },
    { id: "reviews", fields: ["reviews"] },
    { id: "cta", fields: ["cta"] },
  ],
  fields: {
    hero_lead: textarea,
    hero_rotating: lines,
    why_body: textarea,
    store_body: textarea,
    store_perks: lines,
    cta_body: textarea,
  },
  url: "/",
} satisfies Blueprint;

export const homeSectionsBlueprint = {
  key: "homeSections",
  sections: [{ id: "section", fields: ["key", "kicker", "title", "subtitle"] }],
  visibility: ["enabled"],
  fields: {
    key: { widget: "readOnly", choices: "homeSection" },
    subtitle: textarea,
    order: listOrder,
  },
  url: "/",
} satisfies Blueprint;

export const trustItemsBlueprint = {
  key: "trustItems",
  sections: [{ id: "item", fields: ["icon", "title", "detail"] }],
  fields: { id: recordId, icon, order: listOrder },
  url: "/",
} satisfies Blueprint;

export const valuesBlueprint = {
  key: "values",
  sections: [{ id: "value", fields: ["icon", "title", "body"] }],
  fields: { id: recordId, icon, body: textarea, order: listOrder },
  url: "/about-us",
} satisfies Blueprint;

export const timelineBlueprint = {
  key: "timeline",
  sections: [{ id: "event", fields: ["period", "text"] }],
  fields: { id: recordId, text: textarea, order: listOrder },
  url: "/about-us",
} satisfies Blueprint;

export const destinationsBlueprint = {
  key: "destinations",
  sections: [
    { id: "place", fields: ["name", "slug", "subtitle", "iata", "tags"] },
    { id: "photo", fields: ["image"] },
    { id: "facts", fields: ["fromPrice", "flightTime", "bestSeason", "visaNote", "visaEasy"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", source: "name" },
    iata: { widget: "reference", ref: { key: "airports", value: "iata" } },
    tags: { widget: "choices", choices: "destinationTag" },
    ...photoAt("image"),
    fromPrice: money,
    order: listOrder,
    sample: keep,
  },
  url: "/",
} satisfies Blueprint;

export const bannersBlueprint = {
  key: "banners",
  sections: [
    { id: "banner", fields: ["placement", "kicker", "title", "body", "code", "validityText"] },
    { id: "photo", fields: ["image"] },
    { id: "link", fields: ["link"] },
  ],
  visibility: ["enabled", "startsAt", "endsAt"],
  fields: {
    id: recordId,
    placement: { choices: "placement" },
    body: textarea,
    ...photoAt("image"),
    link: { wide: true },
    order: listOrder,
    sample: keep,
  },
} satisfies Blueprint;
