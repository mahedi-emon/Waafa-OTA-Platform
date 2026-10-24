import {
  FRAME,
  icon,
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

/* Waafas World: store words, attribute sets, categories, brands, compatible models, products, collections, deals,
 * store rows and coupons. */

export const shopContentBlueprint = {
  key: "shopContent",
  sections: [
    { id: "tagline", fields: ["tagline"] },
    { id: "bulk", fields: ["bulkStrip"] },
    { id: "finder", fields: ["finderStrip"] },
    { id: "corporate", fields: ["corporate"] },
    { id: "services", fields: ["services"] },
    { id: "trust", fields: ["trust"] },
  ],
  fields: {
    bulkStrip_body: textarea,
    finderStrip_body: textarea,
    corporate_body: textarea,
    corporate_steps: { widget: "repeater", summary: "title", wide: true },
    services: { widget: "repeater", summary: "title", wide: true },
    services_body: textarea,
    services_mediaSlot: { choices: "mediaSlot" },
    trust: { widget: "repeater", summary: "title", wide: true },
    trust_icon: icon,
  },
  url: "/shop",
} satisfies Blueprint;

export const attributeSetsBlueprint = {
  key: "attributeSets",
  sections: [{ id: "set", fields: ["name", "attributes"] }],
  fields: {
    id: recordId,
    attributes: { widget: "repeater", summary: "label", wide: true },
    attributes_key: { auto: "keyFromLabel" },
    attributes_type: { choices: "attributeType" },
    attributes_options: tags,
  },
} satisfies Blueprint;

export const categoriesBlueprint = {
  key: "categories",
  sections: [
    {
      id: "category",
      fields: [
        "name",
        "slug",
        "parentId",
        "icon",
        "description",
        "attributeSetId",
        "compatibility",
      ],
    },
    { id: "photo", fields: ["banner"] },
    { id: "seo", fields: ["seo"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/shop/c/", source: "name" },
    parentId: { widget: "reference", ref: { key: "categories", value: "id" } },
    icon,
    description: textarea,
    attributeSetId: { widget: "reference", ref: { key: "attributeSets", value: "id" } },
    ...photoAt("banner", FRAME.wide),
    level: { auto: "levelFromParent" },
    order: listOrder,
    ...seoAt(),
    ...sample,
  },
  url: "/shop/c/{slug}",
} satisfies Blueprint;

export const brandsBlueprint = {
  key: "brands",
  sections: [
    { id: "brand", fields: ["name", "slug", "description"] },
    { id: "logo", fields: ["logo"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/shop/brand/", source: "name" },
    description: textarea,
    ...photoAt("logo", FRAME.logo),
    ...sample,
  },
  url: "/shop/brand/{slug}",
} satisfies Blueprint;

export const compatibleModelsBlueprint = {
  key: "compatibleModels",
  sections: [{ id: "model", fields: ["brand", "model", "partCodes"] }],
  fields: { id: recordId, partCodes: tags },
  heading: "{brand} {model}",
  url: "/shop/finder",
} satisfies Blueprint;

export const productsBlueprint = {
  key: "products",
  // Basics → Photos → Variants → Price and selling → Specs and compatibility → SEO (ADMIN.md §7, D0 R8).
  sections: [
    {
      id: "basics",
      fields: [
        "title",
        "shortTitle",
        "slug",
        "brandId",
        "categoryId",
        "badges",
        "cardSpec",
        "highlights",
        "description",
      ],
    },
    { id: "photos", fields: ["images", "video"] },
    { id: "variants", fields: ["options", "variants"] },
    { id: "selling", fields: ["showPrice", "codEligible", "bulkFrom", "collectionIds"] },
    { id: "specs", fields: ["specs", "compatibleModelIds", "warranty"] },
    { id: "seo", fields: ["seo"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/shop/p/" },
    brandId: { widget: "reference", ref: { key: "brands", value: "id" } },
    categoryId: { widget: "reference", ref: { key: "categories", value: "id" } },
    badges: { widget: "choices", choices: "productBadge" },
    ...photoList("images", FRAME.square),
    ...videoAt("video"),
    highlights: { widget: "repeater", summary: "text", wide: true },
    highlights_icon: icon,
    description: lines,
    specs: { widget: "repeater", summary: "label", wide: true },
    warranty: { wide: true },
    warranty_items: { widget: "repeater", summary: "title", wide: true },
    warranty_items_icon: icon,
    warranty_items_detail: textarea,
    options: { widget: "repeater", summary: "label", wide: true },
    options_key: { auto: "keyFromLabel" },
    options_display: { choices: "optionDisplay" },
    options_values: { widget: "repeater", summary: "value", wide: true },
    options_values_swatch: { widget: "colour" },
    variants: { widget: "variantsMatrix", wide: true },
    variants_id: { auto: "itemId" },
    variants_options: { widget: "map" },
    variants_price: money,
    variants_mrp: money,
    ...photoList("variants_images", FRAME.square),
    // Chosen by the radio in the variants matrix.
    defaultVariantId: keep,
    compatibleModelIds: { widget: "references", ref: { key: "compatibleModels", value: "id" } },
    collectionIds: { widget: "references", ref: { key: "collections", value: "id" } },
    popularity: keep,
    createdAt: { auto: "nowOnCreate" },
    ...seoAt(),
    ...sample,
  },
  url: "/shop/p/{slug}",
  publish: ["images", "variants"],
} satisfies Blueprint;

export const collectionsBlueprint = {
  key: "collections",
  sections: [
    { id: "collection", fields: ["name", "slug", "description"] },
    { id: "photo", fields: ["image"] },
    { id: "rule", fields: ["rule"] },
  ],
  fields: {
    id: recordId,
    slug: { widget: "slug", prefix: "/shop/collection/", source: "name" },
    description: textarea,
    ...photoAt("image", { ...FRAME.landscape, minWidth: 1000 }),
    rule: { wide: true },
    rule_type: { choices: "collectionRule" },
    rule_productIds: { widget: "references", ref: { key: "products", value: "id" } },
    rule_maxPrice: money,
    rule_categoryIds: { widget: "references", ref: { key: "categories", value: "id" } },
    rule_brandIds: { widget: "references", ref: { key: "brands", value: "id" } },
    rule_badges: { widget: "choices", choices: "productBadge" },
    order: listOrder,
    ...sample,
  },
  url: "/shop/collection/{slug}",
} satisfies Blueprint;

export const dealsBlueprint = {
  key: "deals",
  sections: [{ id: "deal", fields: ["productId", "variantId", "dealPrice", "endsAt"] }],
  fields: {
    id: recordId,
    productId: { widget: "reference", ref: { key: "products", value: "id" } },
    variantId: { widget: "variant", variantOf: "productId" },
    dealPrice: money,
    ...sample,
  },
  url: "/shop/deals",
} satisfies Blueprint;

export const storeRowsBlueprint = {
  key: "storeRows",
  sections: [{ id: "row", fields: ["key", "title", "subtitle"] }],
  visibility: ["enabled"],
  fields: {
    key: { widget: "readOnly", choices: "storeRow" },
    subtitle: textarea,
    order: listOrder,
  },
  url: "/shop",
} satisfies Blueprint;

export const couponsBlueprint = {
  key: "coupons",
  sections: [
    { id: "coupon", fields: ["code", "type", "value", "minOrder", "maxDiscount", "maxUses"] },
  ],
  visibility: ["enabled", "startsAt", "endsAt"],
  fields: {
    type: { choices: "couponType" },
    minOrder: money,
    maxDiscount: money,
    ...sample,
  },
} satisfies Blueprint;
