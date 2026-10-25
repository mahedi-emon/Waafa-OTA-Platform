import {
  FRAME,
  keep,
  itemId,
  lines,
  money,
  phone,
  photoAt,
  readOnly,
  seoAt,
  tags,
  textarea,
} from "./common";
import type { Blueprint } from "./types";

/* Settings (singletons): site, contact, footer, booking modes, payments, delivery, EMI, forms, maintenance, tracking,
 * search. */

export const siteSettingsBlueprint = {
  key: "siteSettings",
  sections: [
    { id: "names", fields: ["travelBrand", "storeName", "companyName", "storeIntro"] },
    { id: "footer", fields: ["footerTagline", "footerAbout"] },
    { id: "search", fields: ["defaultSeo"] },
    {
      id: "connections",
      fields: ["googleSiteVerification", "bingSiteVerification", "reviewsUrl", "accountsLive"],
    },
  ],
  fields: {
    storeIntro: textarea,
    footerAbout: textarea,
    ...seoAt("defaultSeo"),
  },
} satisfies Blueprint;

export const contactSettingsBlueprint = {
  key: "contactSettings",
  sections: [
    { id: "office", fields: ["addressLines", "city", "country", "mapUrl", "visitLabel"] },
    {
      id: "phones",
      fields: [
        "phoneDisplay",
        "phoneE164",
        "whatsappE164",
        "whatsappMessage",
        "extraPhones",
        "helpLine",
      ],
    },
    { id: "email", fields: ["email"] },
    { id: "hours", fields: ["officeHours", "officeHoursText", "closedText"] },
    { id: "socials", fields: ["socials"] },
  ],
  fields: {
    addressLines: lines,
    phoneE164: phone,
    // Typed once: the number as shown follows from the one with the country code (issue 229).
    phoneDisplay: { auto: "phoneDisplay" },
    extraPhones_display: { auto: "phoneDisplay" },
    whatsappE164: phone,
    whatsappMessage: textarea,
    extraPhones: { widget: "repeater", summary: "display", wide: true },
    extraPhones_e164: phone,
    officeHours: { wide: true },
    officeHours_opensAt: { widget: "timeOfDay" },
    officeHours_closesAt: { widget: "timeOfDay" },
    officeHours_days: { widget: "weekdays" },
    officeHoursText: { wide: true },
    socials: { widget: "repeater", summary: "network", wide: true },
    socials_network: { choices: "network" },
  },
} satisfies Blueprint;

export const footerSettingsBlueprint = {
  key: "footerSettings",
  sections: [
    { id: "columns", fields: ["columns"] },
    { id: "payments", fields: ["paymentMethods", "paymentNote", "trustBadges"] },
    { id: "newsletter", fields: ["newsletterTitle", "newsletterPlaceholder", "newsletterButton"] },
    { id: "legal", fields: ["copyrightHolder"] },
  ],
  fields: {
    columns: { widget: "repeater", summary: "title", wide: true },
    columns_menu: { choices: "menuKey" },
    paymentMethods: { widget: "repeater", summary: "label", wide: true },
    paymentMethods_id: { choices: "paymentMethod" },
    paymentNote: textarea,
    trustBadges: { widget: "repeater", summary: "label", wide: true },
    trustBadges_id: itemId,
    ...photoAt("trustBadges_image", FRAME.logo),
  },
} satisfies Blueprint;

/** Live booking stays locked until a provider and online payment exist (Phase E): only the reasons are editable. */
export const bookingModesBlueprint = {
  key: "bookingModes",
  sections: [{ id: "modes", fields: [""] }],
  fields: {
    "": { widget: "repeater", summary: "module", fixed: true, wide: true },
    module: { widget: "readOnly", choices: "bookingModule" },
    mode: { widget: "readOnly", choices: "bookingMode" },
    liveLocked: readOnly,
    lockReason: textarea,
    updatedAt: { auto: "nowOnSave" },
  },
} satisfies Blueprint;

export const paymentSettingsBlueprint = {
  key: "paymentSettings",
  sections: [
    { id: "accounts", fields: ["offlineAccounts"] },
    { id: "cash", fields: ["codLimit", "onlinePaymentLive"] },
  ],
  fields: {
    offlineAccounts: { widget: "repeater", summary: "title", wide: true },
    offlineAccounts_id: itemId,
    offlineAccounts_kind: { choices: "accountKind" },
    offlineAccounts_lines: lines,
    offlineAccounts_instructions: textarea,
    offlineAccounts_sample: keep,
    codLimit: money,
    onlinePaymentLive: readOnly,
  },
} satisfies Blueprint;

export const shippingSettingsBlueprint = {
  key: "shippingSettings",
  sections: [
    { id: "zones", fields: ["zones"] },
    { id: "rules", fields: ["minimumOrder", "freeDeliveryThreshold", "officePickup"] },
  ],
  fields: {
    zones: { widget: "repeater", summary: "name", wide: true },
    zones_id: itemId,
    zones_areas: tags,
    zones_charge: money,
    minimumOrder: money,
    freeDeliveryThreshold: money,
  },
} satisfies Blueprint;

export const emiSettingsBlueprint = {
  key: "emiSettings",
  sections: [
    {
      id: "emi",
      fields: ["minimumAmount", "tenuresMonths", "appliesTo", "cardsNote", "interestNote"],
    },
  ],
  fields: {
    minimumAmount: money,
    tenuresMonths: tags,
    appliesTo: textarea,
    interestNote: textarea,
    sample: keep,
  },
} satisfies Blueprint;

export const leadFormSettingsBlueprint = {
  key: "leadFormSettings",
  sections: [
    { id: "form", fields: ["slaMinutes", "emailRequired", "phoneCountries", "consentText"] },
    { id: "alerts", fields: ["staffAlerts"] },
  ],
  fields: {
    phoneCountries: { widget: "countries" },
    consentText: textarea,
    staffAlerts: { widget: "repeater", summary: "email", wide: true },
    staffAlerts_areas: { widget: "choices", choices: "staffAlertArea" },
  },
} satisfies Blueprint;

export const maintenanceSettingsBlueprint = {
  key: "maintenanceSettings",
  sections: [{ id: "maintenance", fields: ["enabled", "message", "backAt"] }],
  fields: { message: textarea },
} satisfies Blueprint;

export const trackingSettingsBlueprint = {
  key: "trackingSettings",
  sections: [{ id: "tracking", fields: ["ga4Id", "gtmId", "metaPixelId", "searchConsoleToken"] }],
} satisfies Blueprint;

export const searchSettingsBlueprint = {
  key: "searchSettings",
  sections: [
    { id: "flights", fields: ["defaultOrigin", "popularFlights"] },
    { id: "hotels", fields: ["hotelNationalities"] },
    { id: "planTrip", fields: ["planTripPlaces"] },
  ],
  fields: {
    defaultOrigin: { widget: "reference", ref: { key: "airports", value: "iata" } },
    popularFlights: { widget: "references", ref: { key: "airports", value: "iata" } },
    hotelNationalities: tags,
    planTripPlaces: { wide: true },
    planTripPlaces_domestic: tags,
    planTripPlaces_abroad: tags,
  },
} satisfies Blueprint;

export const menusBlueprint = {
  key: "menus",
  sections: [{ id: "menu", fields: ["key", "items"] }],
  fields: {
    key: { choices: "menuKey" },
    items: { widget: "repeater", summary: "label", wide: true },
    items_id: itemId,
    items_icon: { widget: "icon" },
    items_panel: { choices: "menuPanel" },
  },
} satisfies Blueprint;

export const announcementsBlueprint = {
  key: "announcements",
  sections: [{ id: "message", fields: ["text", "link"] }],
  visibility: ["enabled", "startsAt", "endsAt"],
  fields: {
    id: { auto: "recordId" },
    text: textarea,
    link: { wide: true },
    sample: keep,
  },
} satisfies Blueprint;

export const notificationTemplatesBlueprint = {
  key: "notificationTemplates",
  sections: [{ id: "template", fields: ["key", "audience", "channel", "subject", "body"] }],
  visibility: ["enabled"],
  fields: {
    key: { widget: "readOnly", choices: "templateKey" },
    audience: readOnly,
    channel: { choices: "channel" },
    // Details go in with Insert buttons and the message shows as it will arrive (D0 R9).
    subject: { widget: "template", wide: true },
    body: { widget: "templateBody", wide: true },
    variables: keep,
  },
} satisfies Blueprint;
