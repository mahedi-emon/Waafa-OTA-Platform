import type { FieldSpec, PhotoFrame } from "./types";

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

/**
 * The frames photos show in on the site (the SmartImage ratios of the public pages, D0 R3). The editor draws the
 * photo in its frame, crops to it and warns below the width that stays sharp there.
 */
export const FRAME = {
  /** Heroes, visa covers, page banners. */
  wide: { aspect: "16:9", minWidth: 1600 },
  /** Package covers and galleries, album covers. */
  landscape: { aspect: "4:3", minWidth: 1600 },
  /** Blog cards, offers, campaign banners. */
  card: { aspect: "16:10", minWidth: 1200 },
  /** Destination cards. */
  portrait: { aspect: "3:4", minWidth: 900 },
  /** Team members. */
  person: { aspect: "4:5", minWidth: 600 },
  /** Store products and their variants. */
  square: { aspect: "1:1", minWidth: 1000 },
  /** The still shown before a video plays and under reduced motion. */
  poster: { aspect: "16:9", minWidth: 1280 },
  /** The photo search engines and chat apps show with a link. */
  share: { aspect: "1.91:1", minWidth: 1200 },
  /** Logos and badges keep their own shape. */
  logo: { aspect: "free", minWidth: 160 },
  /** Album photos and page photos keep their own shape. */
  free: { aspect: "free", minWidth: 1600 },
} as const satisfies Record<string, PhotoFrame>;

/** A photo object anywhere: drawn in its frame; sizes and focal point are set by the photo field, never typed. */
export const photoAt = (field: string, frame: PhotoFrame): Record<string, FieldSpec> => ({
  [field]: { ...photo, frame },
  [`${field}_width`]: keep,
  [`${field}_height`]: keep,
  [`${field}_focal`]: keep,
});

/** A list of photos (galleries, product photos): uploaded together, ordered by dragging, the first is the cover. */
export const photoList = (field: string, frame: PhotoFrame): Record<string, FieldSpec> => ({
  [field]: { widget: "gallery", wide: true, frame },
  [`${field}_item`]: { ...photo, frame },
  [`${field}_width`]: keep,
  [`${field}_height`]: keep,
  [`${field}_focal`]: keep,
});

/** A video object (loops and clips): the files, uploaded or linked, and the poster photo. */
export const videoAt = (field: string): Record<string, FieldSpec> => ({
  [field]: { widget: "video", wide: true },
  ...photoAt(`${field}_poster`, FRAME.poster),
});

/** Search engine fields: the SEO panel draws them, the share photo is set like any photo. */
export const seoAt = (field = "seo"): Record<string, FieldSpec> => ({
  [field]: seo,
  ...photoAt(`${field}_image`, FRAME.share),
});

/** Every record with Sample data keeps the flag; R4 clears it on the first real save. */
export const sample: Record<string, FieldSpec> = { sample: keep };
