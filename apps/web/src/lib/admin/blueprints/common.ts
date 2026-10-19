import type { FieldSpec } from "./types";

/* Field specs many blueprints share. */

/** Hidden; the stored value stays. */
export const keep: FieldSpec = { auto: "keep" };
/** A new record's id from its title. */
export const recordId: FieldSpec = { auto: "recordId" };
/** A list item's id from its label or title. */
export const itemId: FieldSpec = { auto: "itemId" };
/** The list's drag order (issue 205). */
export const listOrder: FieldSpec = { auto: "listOrder" };
export const money: FieldSpec = { widget: "money" };
export const photo: FieldSpec = { widget: "image" };
export const seo: FieldSpec = { widget: "seo", wide: true };
export const lines: FieldSpec = { widget: "lines" };
export const tags: FieldSpec = { widget: "tags" };
export const phone: FieldSpec = { widget: "phone" };
export const icon: FieldSpec = { widget: "icon" };
export const richText: FieldSpec = { widget: "richText", wide: true };
export const textarea: FieldSpec = { widget: "textarea", wide: true };
export const readOnly: FieldSpec = { widget: "readOnly" };

/** Rich text sections of pages, posts and guides: heading and body, id from the heading. */
export const sectionsList: Record<string, FieldSpec> = {
  sections: { widget: "repeater", summary: "heading", wide: true },
  sections_id: itemId,
  sections_body: richText,
};

/** Question and answer lists. */
export const faqList = (field: string): Record<string, FieldSpec> => ({
  [field]: { widget: "repeater", summary: "question", wide: true },
  [`${field}_question`]: { wide: true },
  [`${field}_answer`]: textarea,
});

/** A photo object anywhere: its sizes are measured, never typed. */
export const photoAt = (field: string): Record<string, FieldSpec> => ({
  [field]: photo,
  [`${field}_width`]: keep,
  [`${field}_height`]: keep,
});

/** A list of photos (galleries, product photos): each item is a photo, the list is ordered by dragging. */
export const photoList = (field: string): Record<string, FieldSpec> => ({
  [field]: { widget: "repeater", summary: "alt", wide: true },
  [`${field}_item`]: photo,
  [`${field}_width`]: keep,
  [`${field}_height`]: keep,
});

/** A video object (loops and clips): poster photo with its sizes measured. */
export const videoAt = (field: string): Record<string, FieldSpec> => ({
  [field]: { wide: true },
  ...photoAt(`${field}_poster`),
});

/** Search engine fields: the SEO panel draws them, the share photo's sizes are measured. */
export const seoAt = (field = "seo"): Record<string, FieldSpec> => ({
  [field]: seo,
  ...photoAt(`${field}_image`),
});

/** Every record with Sample data keeps the flag; R4 clears it on the first real save. */
export const sample: Record<string, FieldSpec> = { sample: keep };
