import type { ImageSchema, VideoSchema } from "@waafa/shared";
import type { In } from "./input";

type ImageInput = In<typeof ImageSchema>;
type VideoInput = In<typeof VideoSchema>;

type PhotoEntry = {
  /** What the photo actually shows (checked by eye; more precise than the CREDITS.txt subjects). */
  alt: string;
  photographer: string;
  /** Unsplash photo id: https://unsplash.com/photos/<id> */
  id: string;
  width: number;
  height: number;
};

/**
 * Real Unsplash photos (Unsplash License), downloaded by docs/design/photos/get-waafa-photos.mjs and served
 * from apps/web/public/media/photos. Credits: docs/design/IMAGE_CREDITS.md. Never AI-generated, painted or
 * drawn images (CLAUDE.md). Pass a more specific `alt` to `photo()` when a use needs one.
 */
const PHOTOS = {
  "hero-wing": { alt: "Airplane wing over the clouds", photographer: "Nicholas Szewczyk", id: "QAemWFs90tU", width: 1600, height: 1067 },
  "hero-wing-alt": { alt: "Airplane wing over clouds at sunrise", photographer: "Johny Goerend", id: "KB9r_hTzyeQ", width: 1600, height: 1067 },
  flights: { alt: "Airplane wing seen through a cabin window", photographer: "Blake Guidry", id: "p9vr45T2scg", width: 1600, height: 1153 },
  coxsbazar: { alt: "Sunset over the waves at Cox’s Bazar", photographer: "Masum Ahmed", id: "dXj8iSUCydo", width: 1600, height: 1200 },
  "coxsbazar-alt": { alt: "Waves on Cox’s Bazar beach", photographer: "Nafiul Hasan", id: "veIrXDU9WQI", width: 900, height: 675 },
  sajek: { alt: "Green hills of Sajek Valley", photographer: "Sium Ahameed Bhuyan", id: "TAUjeniJWjs", width: 900, height: 506 },
  "sajek-alt": { alt: "Clouds over the Sajek hills", photographer: "Sium Ahameed Bhuyan", id: "ADFyoO70OVA", width: 900, height: 675 },
  maldives: { alt: "Overwater villas in the Maldives", photographer: "Ishan @seefromthesky", id: "DtWyp_4YEes", width: 1600, height: 2000 },
  "maldives-alt": { alt: "Island resort in the Maldives", photographer: "Rayyu Maldives", id: "4F4OtnNjpmc", width: 900, height: 1201 },
  dubai: { alt: "Dubai skyline with the Burj Khalifa at sunset", photographer: "David Rodrigo", id: "Fr6zexbmjmc", width: 1600, height: 1067 },
  "dubai-desert": { alt: "Camels in front of the Dubai Marina towers", photographer: "Fredrik Öhlander", id: "fCW1hWq2nq0", width: 900, height: 1350 },
  nepal: { alt: "Village below snow-capped mountains in Nepal", photographer: "Giuseppe Mondì", id: "xyE1p1rG04U", width: 1600, height: 2400 },
  "nepal-alt": { alt: "Boats on Phewa Lake, Pokhara", photographer: "Meera Pankhania", id: "7cENZhgyf7c", width: 900, height: 517 },
  cappadocia: { alt: "Hot-air balloons over the valleys of Cappadocia", photographer: "Chloé Lefleur", id: "ygtKS8lyjb4", width: 900, height: 1200 },
  "cappadocia-alt": { alt: "Balloons over the fairy chimneys of Cappadocia", photographer: "Ricky LK", id: "sqWpPdIU_ao", width: 1600, height: 1067 },
  bali: { alt: "Lake temple in Bali", photographer: "Aron Visuals", id: "1kdIG_258bU", width: 900, height: 1194 },
  "bali-alt": { alt: "Sea temple at sunset in Bali", photographer: "Harry Kessell", id: "eE2trMn-6a0", width: 900, height: 600 },
  thailand: { alt: "Boats in a turquoise bay below limestone cliffs, Thailand", photographer: "Humphrey M", id: "TejFa7VW5e4", width: 1600, height: 1199 },
  "thailand-alt": { alt: "Island bay and green hills in Thailand", photographer: "Evan Krause", id: "BU6lABNbTpA", width: 900, height: 600 },
  singapore: { alt: "Marina Bay Sands, Singapore", photographer: "Hu Chen", id: "__cBlRzLSTg", width: 900, height: 694 },
  kualalumpur: { alt: "Petronas Towers at night, Kuala Lumpur", photographer: "Ismail Bashiri", id: "GdjZs5JZwZA", width: 1600, height: 2133 },
  visa: { alt: "Open passport with entry stamps", photographer: "Kit", id: "htQznS-Rx7w", width: 1600, height: 1067 },
  "visa-alt": { alt: "Passport on a boarding pass", photographer: "Nicole Geri", id: "gMJ3tFOLvnA", width: 900, height: 522 },
  printing: { alt: "Office printer on a stand", photographer: "Mahrous Houses", id: "5AoOejjRUrA", width: 1600, height: 1067 },
  "printing-alt": { alt: "Ink cartridges inside a printer", photographer: "Jakub Żerdzicki", id: "Da9qsu-0a00", width: 1200, height: 801 },
  trading: { alt: "Container ship at a port", photographer: "Andy Li", id: "CpsTAUPoScw", width: 1600, height: 1067 },
  "trading-alt": { alt: "Container terminal from above", photographer: "Ali Mkumbwa", id: "Annl9CjEaEs", width: 900, height: 600 },
  "prod-tshirt": { alt: "Folded T-shirts in white and navy", photographer: "Md Salman", id: "tWOz2_EK5EQ", width: 1200, height: 2133 },
  "prod-powerbank": { alt: "Power bank charging a phone", photographer: "I’M ZION", id: "APdfyW0Aq-E", width: 1200, height: 1800 },
  "prod-headphones": { alt: "Over-ear headphones on a yellow background", photographer: "C D-X", id: "PDX_a_82obo", width: 1200, height: 800 },
  "cat-stationery": { alt: "Scissors, envelopes and pencils on a desk", photographer: "Joanna Kosinska", id: "bF2vsubyHcQ", width: 900, height: 601 },
} as const satisfies Record<string, PhotoEntry>;

export type PhotoKey = keyof typeof PHOTOS;

export const PHOTO_KEYS = Object.keys(PHOTOS) as PhotoKey[];

/** A real photo by key with its size, alt text and linked Unsplash credit. */
export function photo(key: PhotoKey, alt?: string): ImageInput {
  const entry: PhotoEntry = PHOTOS[key];
  return {
    src: `/media/photos/${key}.jpg`,
    alt: alt ?? entry.alt,
    width: entry.width,
    height: entry.height,
    credit: `${entry.photographer} · Unsplash`,
    creditUrl: `https://unsplash.com/photos/${entry.id}`,
  };
}

/** Waafa International's own product photos (Better Day toner, supplied by Waafa), 900 × 900. */
export function productShot(file: `prod-${string}.jpg`, alt: string): ImageInput {
  return { src: `/media/products/${file}`, alt, width: 900, height: 900 };
}

/**
 * Motion-graphic loops from the prototype that the site may use (HANDOFF: route map, passport, product videos).
 * The rendered scenery loops (wing over clouds, lagoon, balloons, port, printer, city) are not shipped;
 * TRACKER lists them for licensed footage.
 */
const VIDEOS = {
  "routes-from-dhaka": { alt: "Animated map of flight routes from Dhaka" },
  passport: { alt: "Animated passport opening to a stamped page" },
  "power-bank": { alt: "Animation of a 20,000 mAh power bank charging" },
  headphones: { alt: "Animation of over-ear headphones" },
  "toner-cf280a": { alt: "Close-up of the Better Day CE505A / CF280A toner and its box" },
} as const satisfies Record<string, { alt: string }>;

export type VideoKey = keyof typeof VIDEOS;

export const VIDEO_KEYS = Object.keys(VIDEOS) as VideoKey[];

/** A loop by key: WebM and MP4 sources with its 1280 × 720 poster. */
export function video(key: VideoKey, caption?: string): VideoInput {
  const base = `/media/video/${key}`;
  return {
    mp4: `${base}.mp4`,
    webm: `${base}.webm`,
    poster: { src: `${base}.webp`, alt: VIDEOS[key].alt, width: 1280, height: 720 },
    ...(caption === undefined ? {} : { caption }),
  };
}
