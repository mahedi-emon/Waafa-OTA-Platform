import type { ImageSchema } from "@waafa/shared";
import type { In } from "./input";

type ImageInput = In<typeof ImageSchema>;

/**
 * Real Unsplash photos listed in docs/design/photos/CREDITS.txt, with the subjects written there (pass a more
 * specific `alt` per use). `get-waafa-photos.mjs` saves them as <key>.jpg; the build serves them from
 * apps/web/public/images/. Never AI-generated, painted or drawn (CLAUDE.md).
 */
const PHOTOS = {
  "hero-wing": ["Airplane wing over clouds at sunrise", "Nicholas Szewczyk"],
  "hero-wing-alt": ["Airplane wing over clouds", "Johny Goerend"],
  flights: ["Aircraft", "Blake Guidry"],
  coxsbazar: ["Cox’s Bazar beach", "Masum Ahmed"],
  "coxsbazar-alt": ["Cox’s Bazar", "Nafiul Hasan"],
  sajek: ["Sajek Valley above the clouds", "Sium Ahameed Bhuyan"],
  "sajek-alt": ["Sajek Valley", "Sium Ahameed Bhuyan"],
  maldives: ["Maldives overwater villas", "Ishan @seefromthesky"],
  "maldives-alt": ["Maldives", "Rayyu Maldives"],
  dubai: ["Dubai skyline", "David Rodrigo"],
  "dubai-desert": ["Dubai desert", "Fredrik Öhlander"],
  nepal: ["Nepal", "Giuseppe Mondì"],
  "nepal-alt": ["Nepal", "Meera Pankhania"],
  cappadocia: ["Balloons over Cappadocia", "Chloé Lefleur"],
  "cappadocia-alt": ["Cappadocia, Türkiye", "Ricky LK"],
  bali: ["Temple in Bali", "Aron Visuals"],
  "bali-alt": ["Bali", "Harry Kessell"],
  thailand: ["Islands in Thailand", "Humphrey M"],
  "thailand-alt": ["Thailand", "Evan Krause"],
  singapore: ["Marina Bay, Singapore", "Hu Chen"],
  kualalumpur: ["Petronas Towers, Kuala Lumpur", "Ismail Bashiri"],
  visa: ["Passport and boarding pass", "Kit"],
  "visa-alt": ["Passport and travel", "Nicole Geri"],
  printing: ["Office printer", "Mahrous Houses"],
  "printing-alt": ["Toner cartridge and printing", "Jakub Żerdzicki"],
  trading: ["Container port", "Andy Li"],
  "trading-alt": ["Shipping and trade", "Ali Mkumbwa"],
  "prod-tshirt": ["T-shirt", "Md Salman"],
  "prod-powerbank": ["Power bank", "I’M ZION"],
  "prod-headphones": ["Wireless headphones", "C D-X"],
  "cat-stationery": ["Office stationery", "Joanna Kosinska"],
} as const;

export type PhotoKey = keyof typeof PHOTOS;

/** A real photo by key, with its alt text and Unsplash credit. Pass `alt` to describe it for a specific use. */
export function photo(key: PhotoKey, alt?: string): ImageInput {
  const [subject, photographer] = PHOTOS[key];
  return { src: `/images/${key}.jpg`, alt: alt ?? subject, credit: `${photographer} · Unsplash` };
}

/** Waafa International's own product photos (Better Day toner), copied from docs/design/assets in issue #5. */
export function productShot(file: string, alt: string): ImageInput {
  return { src: `/images/products/${file}`, alt };
}

export const PHOTO_KEYS = Object.keys(PHOTOS) as PhotoKey[];
