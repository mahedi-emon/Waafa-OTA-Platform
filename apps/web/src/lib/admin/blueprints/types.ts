import type { CollectionKey, ContentKey } from "@waafa/shared";

/*
 * Form engine v2 (D0 R2, ADMIN.md §7). A blueprint says how staff edit one CONTENT_MODEL key: its sections, the widget
 * and options of each field, what the system fills in by itself, what Publish needs and where the record shows on the
 * site. Blueprints are plain data: the server resolves their words from messages (resolveBlueprint) and hands the
 * result to the editor, so no message catalogue ships to the browser.
 *
 * Fields are named by pattern: the field names on the way down joined with "_", list positions left out
 * ("prices_price" is the price of every row of `prices`).
 */

/** How a field is edited. Without one the engine picks from the schema (text, number, switch, choice, list, group). */
export type WidgetKind =
  | "text"
  | "textarea"
  | "richText"
  | "slug"
  | "money"
  | "number"
  | "date"
  | "dateTime"
  | "switch"
  | "choice"
  | "choices"
  | "reference"
  | "references"
  | "tags"
  | "months"
  | "lines"
  | "repeater"
  | "icon"
  | "colour"
  | "phone"
  | "timeOfDay"
  | "weekdays"
  /** Countries by name in order, the first the default (phone picker countries, issue 229). */
  | "countries"
  /** The Golden Switch as one card per service: mode, lock and its reason (issue 229). */
  | "bookingModes"
  | "image"
  | "gallery"
  | "video"
  | "seo"
  | "map"
  | "variant"
  /** A product's variants as a matrix of its option values, with the default by radio (D0 R8). */
  | "variantsMatrix"
  | "template"
  | "templateBody"
  /** Where a link goes: a page or record by name, or a web address, phone or email (D0 R7). */
  | "link"
  | "readOnly";

/** What the editor fills in by itself; staff never type these. */
export type AutoRule =
  /** Hidden; the stored value stays (popularity, Sample, photo sizes). */
  | "keep"
  /** A new record's id, made from its title; kept afterwards. */
  | "recordId"
  /** A list item's id, made from its label or title and unique in the list. */
  | "itemId"
  /** A new record gets today's date (Asia/Dhaka); kept afterwards. */
  | "today"
  /** Today's date on every save ("Last updated"). */
  | "todayOnSave"
  /** A new record gets the current date and time; kept afterwards. */
  | "nowOnCreate"
  /** The current date and time on every save. */
  | "nowOnSave"
  /** List items numbered 1, 2, 3 in list order (itinerary days). */
  | "dayNumber"
  /** Minutes to read, from the length of the text. */
  | "readingMinutes"
  /** A store category's level: 0 at the top, one more than its parent below. */
  | "levelFromParent"
  /** The list owns it (drag order); the API keeps it on save (issue 205). */
  | "listOrder"
  /** A list item's key in camelCase from its label ("Page yield" → "pageYield"), unique in the list. */
  | "keyFromLabel"
  /** The lowest price among the record's price options (a package's "Price from", D0 R8). */
  | "lowestPrice"
  /** A person's initials from their name ("Rafiq Ahmed" → "RA"), shown until a photo is uploaded. */
  | "initialsFromName"
  /** How many days the record's itinerary has (a package's length in days, D0 R8). */
  | "itineraryDays"
  /** A phone number as people read it ("01712-345678") from the same record's number with country code (issue 229). */
  | "phoneDisplay";

export type ReferenceSpec = {
  /** The list the choices come from. */
  key: CollectionKey;
  /** Which value of the chosen record is stored; the record's own id when left out. */
  value?: "id" | "slug" | "code" | "key" | "iata";
  /**
   * Copies parts of the chosen record into this object instead of storing a value (group fares keep the airline's
   * code, name and logo): field → "value" | "title" | "image".
   */
  embed?: Record<string, "value" | "title" | "image">;
  /** Also fills sibling fields from the chosen record (a baggage rule's airline name from its code). */
  fill?: Record<string, "value" | "title" | "image">;
  /**
   * The choices are the different values of this field across the list's records (a package's destination group),
   * and staff can add a new one by typing its name.
   */
  distinct?: string;
};

/** Where a photo shows on the site (D0 R3): the frame staff see while editing and the narrowest photo that stays sharp. */
export type PhotoFrame = {
  /** Width:height of the main place it shows ("16:9"); "free" keeps the photo's own shape (logos, album photos). */
  aspect: `${number}:${number}` | "free";
  /** Narrower photos get a warning: they would look soft there. */
  minWidth: number;
};

export type FieldSpec = {
  widget?: WidgetKind;
  auto?: AutoRule;
  /** Labels for an enum's values come from Admin.choices.<choices>; defaults to the field's own name. */
  choices?: string;
  ref?: ReferenceSpec;
  /** Repeater: the item field shown as each card's title. */
  summary?: string;
  /** Repeater: the items are fixed (no add, remove or reorder), e.g. the booking modes. */
  fixed?: boolean;
  /** Slug: the public address in front of it ("/packages/"). */
  prefix?: string;
  /** Slug: the field it follows until staff edit it (title by default). */
  source?: string;
  /** Takes the full width of the form. */
  wide?: boolean;
  /** Group: the order its fields appear in (the rest follow in schema order). */
  order?: string[];
  /** Choice: the options are the items of another list in this record (a product's default variant). */
  from?: { list: string; value: string; label: string };
  /** Variant: the sibling field holding the product whose variants are offered. */
  variantOf?: string;
  /** Photo, gallery: the frame it shows in on the site. */
  frame?: PhotoFrame;
  /**
   * Repeater of photo items (a gallery album, D0 R8): several photos dropped at once each become an item, with the
   * photo in `image` and the fixed parts in `with` ({ kind: "photo" }).
   */
  bulkPhotos?: BulkPhotos;
};

export type BulkPhotos = { image: string; with?: Record<string, string> };

export type SectionSpec = {
  id: string;
  /** Top-level fields drawn in this section, in order. A section of one group draws the group's own fields. */
  fields: string[];
};

export type Blueprint = {
  key: ContentKey;
  sections: SectionSpec[];
  fields?: Record<string, FieldSpec>;
  /** Top-level switches and dates drawn in the side panel under Visibility (Show on website, Starts, Ends). */
  visibility?: string[];
  /**
   * Where a published record shows on the site: "/tour-packages/{slug}" (tokens are top-level fields), or one address
   * per record id when the addresses differ (service pages).
   */
  url?: string | Record<string, string>;
  /** The editor's heading when the title field alone says little: "{from_city} → {to_city}". */
  heading?: string;
  /** "writing": a wide column for long text, without the section list beside it (a blog post, D0 R8). */
  layout?: "writing";
  /** Values a new record starts with instead of the schema's empty ones (a new team member shows, D0 R8). */
  startWith?: Record<string, unknown>;
  /** What Publish needs besides valid fields: patterns that must not be empty ("cover_src", "prices"). */
  publish?: string[];
};

/** A field as the editor receives it: words resolved, widget decided. */
export type ResolvedField = {
  label: string;
  help?: string;
  widget: WidgetKind | "group" | "list" | "union" | "json";
  hidden?: boolean;
  auto?: AutoRule;
  /** Enum value → label, in schema order. */
  choices?: Array<{ value: string; label: string }>;
  ref?: ReferenceSpec & { nouns: { one: string; other: string } };
  summary?: string;
  fixed?: boolean;
  prefix?: string;
  source?: string;
  wide?: boolean;
  order?: string[];
  from?: { list: string; value: string; label: string };
  variantOf?: string;
  frame?: PhotoFrame;
  bulkPhotos?: BulkPhotos;
};

export type ResolvedSection = {
  id: string;
  title: string;
  lead?: string;
  fields: string[];
};

export type ResolvedBlueprint = {
  key: ContentKey;
  kind: "singleton" | "collection";
  idField?: string;
  titleField?: string;
  nouns: { one: string; other: string };
  /** What it is and where it shows, one line. */
  intro: string;
  sections: ResolvedSection[];
  /** Every field of the schema by pattern. */
  fields: Record<string, ResolvedField>;
  /** Top-level fields that belong to no section and aren't automatic (Super Admin only, under Advanced). */
  advanced: string[];
  visibility: string[];
  url?: string | Record<string, string>;
  heading?: string;
  /** "embedded" (set by the page, not the blueprint): inside the settings frame, without the section list and with
   * the side panel folded above the form at every width (D0 R9). */
  layout?: "writing" | "embedded";
  startWith?: Record<string, unknown>;
  publish: Array<{ path: string; label: string }>;
  /** The record has a draft / published / archived status, set by Save draft, Publish and Unpublish. */
  workflow: boolean;
  /** Duplicate is offered: false for lists of fixed places or codes, where a copy can't be valid. */
  duplicable: boolean;
  /** Move to Trash is offered (fixed lists can't be deleted, issue 229). */
  deletable: boolean;
  sample: boolean;
  seo: boolean;
};
