import type {
  AttributeSetSchema,
  BrandSchema,
  CategorySchema,
  CollectionSchema,
  CompatibleModelSchema,
  CouponSchema,
  DealSchema,
  OrderSchema,
  ProductSchema,
  StoreRowSchema,
} from "@waafa/shared";
import { photo, productShot, video } from "./images";
import type { In } from "./input";

/* ------------------------------------------------------------------------------------------------
 * Waafas World catalogue (FR-CAT, FR-SHOP). Everyday products only: no restricted items (PRD §2).
 * The Better Day toners use Waafa International’s own product photos; the T-shirt, power bank and
 * headphones are sample listings with Unsplash photos and fictional brands. Prices are samples.
 * ---------------------------------------------------------------------------------------------- */

export const attributeSets: In<typeof AttributeSetSchema>[] = [
  {
    id: "set-toner",
    name: "Toner and ink",
    attributes: [
      {
        key: "colour",
        label: "Colour",
        type: "select",
        options: ["Black", "Cyan", "Magenta", "Yellow"],
        filterable: true,
      },
      { key: "pageYield", label: "Page yield", type: "number", unit: "pages", filterable: true },
      {
        key: "cartridgeType",
        label: "Type",
        type: "select",
        options: ["Original", "Compatible"],
        filterable: true,
      },
    ],
  },
  {
    id: "set-power",
    name: "Power banks",
    attributes: [
      {
        key: "capacity",
        label: "Capacity",
        type: "select",
        options: ["10,000 mAh", "20,000 mAh"],
        filterable: true,
      },
      { key: "output", label: "Fast charging", type: "number", unit: "W", filterable: true },
    ],
  },
  {
    id: "set-audio",
    name: "Headphones and earbuds",
    attributes: [
      { key: "batteryHours", label: "Battery", type: "number", unit: "h", filterable: true },
      {
        key: "connectivity",
        label: "Connection",
        type: "select",
        options: ["Bluetooth", "Wired"],
        filterable: true,
      },
    ],
  },
  {
    id: "set-clothing",
    name: "Clothing",
    attributes: [
      {
        key: "size",
        label: "Size",
        type: "select",
        options: ["S", "M", "L", "XL", "XXL"],
        filterable: true,
      },
      { key: "colour", label: "Colour", type: "select", filterable: true },
      { key: "material", label: "Material", type: "text" },
    ],
  },
];

export const categories: In<typeof CategorySchema>[] = [
  {
    id: "cat-printers",
    slug: "printers-and-supplies",
    name: "Printers & Supplies",
    parentId: null,
    level: 1,
    icon: "printer",
    description: "Toner, ink, paper, printers",
    order: 0,
    sample: true,
  },
  {
    id: "cat-toner",
    slug: "toner-cartridges",
    name: "Toner cartridges",
    parentId: "cat-printers",
    level: 2,
    icon: "printer",
    description: "Original and compatible toner, with the printers each one fits",
    attributeSetId: "set-toner",
    compatibility: true,
    order: 0,
    sample: true,
  },
  {
    id: "cat-office",
    slug: "office-and-stationery",
    name: "Office & Stationery",
    parentId: null,
    level: 1,
    icon: "pencil-ruler",
    description: "Pens, files, desk supplies",
    banner: photo("cat-stationery"),
    order: 1,
    sample: true,
  },
  {
    id: "cat-computer",
    slug: "computer-and-accessories",
    name: "Computer & Accessories",
    parentId: null,
    level: 1,
    icon: "monitor",
    description: "Mice, keyboards, cables",
    order: 2,
    sample: true,
  },
  {
    id: "cat-electronics",
    slug: "electronics-and-gadgets",
    name: "Electronics & Gadgets",
    parentId: null,
    level: 1,
    icon: "headphones",
    description: "Power banks, audio",
    order: 3,
    sample: true,
  },
  {
    id: "cat-power-banks",
    slug: "power-banks",
    name: "Power banks",
    parentId: "cat-electronics",
    level: 2,
    icon: "battery-charging",
    attributeSetId: "set-power",
    order: 0,
    sample: true,
  },
  {
    id: "cat-headphones",
    slug: "headphones",
    name: "Headphones",
    parentId: "cat-electronics",
    level: 2,
    icon: "headphones",
    attributeSetId: "set-audio",
    order: 1,
    sample: true,
  },
  {
    id: "cat-home",
    slug: "home-and-kitchen",
    name: "Home & Kitchen",
    parentId: null,
    level: 1,
    icon: "cooking-pot",
    description: "Bottles, storage",
    order: 4,
    sample: true,
  },
  {
    id: "cat-fashion",
    slug: "fashion-and-lifestyle",
    name: "Fashion & Lifestyle",
    parentId: null,
    level: 1,
    icon: "shirt",
    description: "T-shirts, bags, gifts",
    order: 5,
    sample: true,
  },
  {
    id: "cat-tshirts",
    slug: "t-shirts",
    name: "T-shirts",
    parentId: "cat-fashion",
    level: 2,
    icon: "shirt",
    attributeSetId: "set-clothing",
    order: 0,
    sample: true,
  },
];

export const brands: In<typeof BrandSchema>[] = [
  {
    id: "brand-better-day",
    slug: "better-day",
    name: "Better Day",
    description: "Compatible toner cartridges, sold by Waafa International",
    sample: true,
  },
  {
    id: "brand-tessra",
    slug: "tessra",
    name: "Tessra",
    description: "Sample clothing brand",
    sample: true,
  },
  {
    id: "brand-voltaro",
    slug: "voltaro",
    name: "Voltaro",
    description: "Sample power and charging brand",
    sample: true,
  },
  {
    id: "brand-sonaro",
    slug: "sonaro",
    name: "Sonaro",
    description: "Sample audio brand",
    sample: true,
  },
];

/** Printer models for Find by model (FR-SHOP-05), with the part codes that fit them. */
export const compatibleModels: In<typeof CompatibleModelSchema>[] = [
  { id: "hp-lj-p2035", brand: "HP", model: "LaserJet P2035", partCodes: ["CE505A", "05A"] },
  { id: "hp-lj-p2055d", brand: "HP", model: "LaserJet P2055d", partCodes: ["CE505A", "05A"] },
  {
    id: "hp-lj-pro-400-m401dn",
    brand: "HP",
    model: "LaserJet Pro 400 M401dn",
    partCodes: ["CF280A", "80A"],
  },
  {
    id: "hp-lj-pro-400-mfp-m425dn",
    brand: "HP",
    model: "LaserJet Pro 400 MFP M425dn",
    partCodes: ["CF280A", "80A"],
  },
  {
    id: "hp-lj-pro-4003dn",
    brand: "HP",
    model: "LaserJet Pro 4003dn",
    partCodes: ["W1510A", "151A"],
  },
  {
    id: "canon-lbp243dw",
    brand: "Canon",
    model: "i-SENSYS LBP243dw",
    partCodes: ["CRG 070", "CRG 070H"],
  },
  {
    id: "canon-lbp246dw",
    brand: "Canon",
    model: "i-SENSYS LBP246dw",
    partCodes: ["CRG 070", "CRG 070H"],
  },
];

type Product = In<typeof ProductSchema>;

const STANDARD_DELIVERY = {
  icon: "truck",
  title: "Delivery",
  detail: "Next day in Dhaka, 2 to 4 days elsewhere.",
};

function tonerWarranty(): Product["warranty"] {
  return {
    short: "Replacement if faulty",
    returnsShort: "Tell us within 7 days",
    items: [
      {
        icon: "shield-check",
        title: "Replacement if faulty",
        detail: "Tell us within 7 days with a test print.",
      },
      {
        icon: "printer",
        title: "Not sure it fits?",
        detail: "Use Find by model or send us your printer model.",
      },
      STANDARD_DELIVERY,
    ],
  };
}

const TEE_COLOURS = [
  { value: "White", swatch: "#F4F5F7", code: "WHT" },
  { value: "Navy", swatch: "#1E2B55", code: "NVY" },
  { value: "Black", swatch: "#1C1F26", code: "BLK" },
  { value: "Heather grey", swatch: "#A7ADB8", code: "HGR" },
] as const;
const TEE_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

/** Stock per colour and size: Black S is sold out and Navy XL is low, as on the ShopProduct board. */
function teeStock(colour: string, size: string): number {
  if (colour === "Black" && size === "S") return 0;
  if (colour === "Navy" && size === "XL") return 2;
  return 12;
}

const teeVariants: Product["variants"] = TEE_COLOURS.flatMap((colour) =>
  TEE_SIZES.map((size) => ({
    id: `tee-${colour.code.toLowerCase()}-${size.toLowerCase()}`,
    sku: `TSR-TEE-${colour.code}-${size}`,
    options: { colour: colour.value, size },
    // XXL costs ৳50 more (the `extra` rule on the board).
    price: size === "XXL" ? 700 : 650,
    mrp: size === "XXL" ? 900 : 850,
    stock: teeStock(colour.value, size),
  })),
);

export const products: Product[] = [
  {
    id: "prod-bd-cf280a",
    slug: "better-day-ce505a-cf280a-black-toner",
    title: "Better Day CE505A / CF280A Black Toner",
    shortTitle: "Better Day CE505A / CF280A",
    brandId: "brand-better-day",
    categoryId: "cat-toner",
    badges: ["best-seller"],
    cardSpec: "Compatible · up to 2,700 pages",
    highlights: [
      { icon: "file-text", text: "Up to 2,700 pages at 5%" },
      { icon: "printer-check", text: "Fits like the original" },
      { icon: "badge-check", text: "Tested before dispatch" },
      { icon: "rotate-ccw", text: "Replaced if faulty" },
    ],
    description: [
      "A compatible black toner for HP LaserJet printers that take the 05A or 80A cartridge. Made by Better Day and sold by Waafa International as a lower-cost alternative to the original.",
      "Compatible means it is not made by HP. It fits and prints the same way; yield and density can differ slightly from the original.",
    ],
    specs: [
      { label: "Brand", value: "Better Day" },
      { label: "Type", value: "Compatible toner cartridge" },
      { label: "Replaces", value: "HP CE505A (05A), HP CF280A (80A)" },
      { label: "Colour", value: "Black" },
      { label: "Page yield", value: "About 2,700 pages at 5% coverage" },
      { label: "Sold by", value: "Waafa International, Motijheel" },
    ],
    warranty: tonerWarranty(),
    images: [
      productShot(
        "prod-cf280a.jpg",
        "Better Day CE505A / CF280A black toner cartridge in front of its box",
      ),
    ],
    variants: [
      { id: "bd-cf280a", sku: "BD-CF280A", options: {}, price: 1450, mrp: 1800, stock: 24 },
    ],
    defaultVariantId: "bd-cf280a",
    compatibleModelIds: [
      "hp-lj-p2035",
      "hp-lj-p2055d",
      "hp-lj-pro-400-m401dn",
      "hp-lj-pro-400-mfp-m425dn",
    ],
    collectionIds: ["col-office"],
    bulkFrom: 10,
    popularity: 98,
    createdAt: "2026-09-20T10:00:00+06:00",
    status: "published",
    sample: true,
  },
  {
    id: "prod-bd-crg070h",
    slug: "better-day-canon-crg-070h-black-toner",
    title: "Better Day Canon CRG 070H Black Toner",
    shortTitle: "Better Day CRG 070H",
    brandId: "brand-better-day",
    categoryId: "cat-toner",
    badges: [],
    cardSpec: "Compatible · up to 9,000 pages",
    highlights: [
      { icon: "file-text", text: "Up to 9,000 pages at 5%" },
      { icon: "printer-check", text: "Fits like the original" },
      { icon: "badge-check", text: "Tested before dispatch" },
      { icon: "rotate-ccw", text: "Replaced if faulty" },
    ],
    description: [
      "A high-yield compatible black toner for Canon printers that take the 070 cartridge. Made by Better Day and sold by Waafa International.",
      "Compatible means it is not made by Canon. It fits and prints the same way; yield and density can differ slightly from the original.",
    ],
    specs: [
      { label: "Brand", value: "Better Day" },
      { label: "Type", value: "Compatible toner cartridge" },
      { label: "Replaces", value: "Canon CRG 070H" },
      { label: "Colour", value: "Black" },
      { label: "Page yield", value: "About 9,000 pages at 5% coverage" },
      { label: "Sold by", value: "Waafa International, Motijheel" },
    ],
    warranty: tonerWarranty(),
    images: [
      productShot(
        "prod-crg070h.jpg",
        "Better Day CRG 070H black toner cartridge in front of its box",
      ),
    ],
    variants: [
      { id: "bd-crg070h", sku: "BD-CRG070H", options: {}, price: 3250, mrp: 3900, stock: 9 },
    ],
    defaultVariantId: "bd-crg070h",
    compatibleModelIds: ["canon-lbp243dw", "canon-lbp246dw"],
    collectionIds: ["col-office"],
    bulkFrom: 10,
    popularity: 72,
    createdAt: "2026-09-22T10:00:00+06:00",
    status: "published",
    sample: true,
  },
  {
    id: "prod-bd-w1510a",
    slug: "better-day-hp-151a-w1510a-black-toner",
    title: "Better Day HP 151A (W1510A) Black Toner",
    shortTitle: "Better Day 151A (W1510A)",
    brandId: "brand-better-day",
    categoryId: "cat-toner",
    badges: ["new"],
    cardSpec: "Compatible · up to 3,050 pages",
    highlights: [
      { icon: "file-text", text: "Up to 3,050 pages at 5%" },
      { icon: "printer-check", text: "Fits like the original" },
      { icon: "badge-check", text: "Tested before dispatch" },
      { icon: "rotate-ccw", text: "Replaced if faulty" },
    ],
    description: [
      "A compatible black toner for HP LaserJet Pro printers that take the 151A cartridge. Made by Better Day and sold by Waafa International.",
      "Compatible means it is not made by HP. It fits and prints the same way; yield and density can differ slightly from the original.",
    ],
    specs: [
      { label: "Brand", value: "Better Day" },
      { label: "Type", value: "Compatible toner cartridge" },
      { label: "Replaces", value: "HP W1510A (151A)" },
      { label: "Colour", value: "Black" },
      { label: "Page yield", value: "About 3,050 pages at 5% coverage" },
      { label: "Sold by", value: "Waafa International, Motijheel" },
    ],
    warranty: tonerWarranty(),
    images: [
      productShot(
        "prod-w1510a.jpg",
        "Better Day 151A (W1510A) black toner cartridge in front of its box",
      ),
    ],
    variants: [
      { id: "bd-w1510a", sku: "BD-W1510A", options: {}, price: 2150, mrp: 2600, stock: 3 },
    ],
    defaultVariantId: "bd-w1510a",
    compatibleModelIds: ["hp-lj-pro-4003dn"],
    collectionIds: ["col-office"],
    bulkFrom: 10,
    popularity: 64,
    createdAt: "2026-10-01T10:00:00+06:00",
    status: "published",
    sample: true,
  },
  {
    id: "prod-tee",
    slug: "classic-cotton-crew-t-shirt",
    title: "Classic Cotton Crew T-shirt",
    shortTitle: "Classic Cotton Crew T-shirt",
    brandId: "brand-tessra",
    categoryId: "cat-tshirts",
    badges: ["new"],
    cardSpec: "Sizes S to XXL · 4 colours",
    highlights: [
      { icon: "leaf", text: "100% combed cotton, 180 GSM" },
      { icon: "refresh-ccw", text: "Pre-shrunk, keeps its shape" },
      { icon: "ruler", text: "Regular fit, ribbed collar" },
      { icon: "flag", text: "Made in Bangladesh" },
    ],
    description: [
      "A heavyweight everyday T-shirt in soft combed cotton. The ribbed collar keeps its shape wash after wash, and the regular fit works on its own or under a shirt.",
    ],
    specs: [
      { label: "Material", value: "100% combed cotton" },
      { label: "Weight", value: "180 GSM" },
      { label: "Fit", value: "Regular" },
      { label: "Neck", value: "Crew, ribbed" },
      { label: "Sleeve", value: "Short" },
      { label: "Care", value: "Machine wash cold, do not tumble dry" },
      { label: "Origin", value: "Bangladesh" },
    ],
    warranty: {
      short: "Easy size exchange",
      returnsShort: "Exchange within 7 days if unworn with tags",
      items: [
        {
          icon: "refresh-ccw",
          title: "Size exchange in 7 days",
          detail: "Unworn, with tags. We collect and deliver the new size in Dhaka.",
        },
        {
          icon: "rotate-ccw",
          title: "Refund if faulty",
          detail: "Tell us within 48 hours with a photo.",
        },
        STANDARD_DELIVERY,
      ],
    },
    images: [photo("prod-tshirt", "Classic cotton crew T-shirt")],
    options: [
      {
        key: "colour",
        label: "Colour",
        display: "swatch",
        values: TEE_COLOURS.map(({ value, swatch }) => ({ value, swatch })),
      },
      {
        key: "size",
        label: "Size",
        display: "size",
        values: TEE_SIZES.map((value) => ({ value })),
      },
    ],
    variants: teeVariants,
    defaultVariantId: "tee-wht-m",
    collectionIds: ["col-everyday"],
    bulkFrom: 20,
    popularity: 80,
    createdAt: "2026-10-03T10:00:00+06:00",
    status: "published",
    sample: true,
  },
  {
    id: "prod-power-bank",
    slug: "voltaro-power-bank-22-5w",
    title: "Voltaro Power Bank, 22.5 W Fast Charge",
    shortTitle: "Voltaro Power Bank",
    brandId: "brand-voltaro",
    categoryId: "cat-power-banks",
    badges: ["best-seller"],
    cardSpec: "10,000 or 20,000 mAh · USB-C PD",
    highlights: [
      { icon: "zap", text: "22.5 W fast charging" },
      { icon: "smartphone-charging", text: "Charges 3 devices at once" },
      { icon: "plane", text: "Under 100 Wh, cabin-bag safe" },
      { icon: "battery-full", text: "LED battery display" },
    ],
    description: [
      "Charge your phone, earbuds and a tablet together, and top up the power bank itself from USB-C. The 20,000 mAh model charges a phone about four times.",
      "Both sizes are under the 100 Wh limit most airlines allow in cabin bags. Check your airline before you fly.",
    ],
    specs: [
      { label: "Capacity", value: "10,000 mAh (37 Wh) or 20,000 mAh (74 Wh)" },
      { label: "Output", value: "USB-C PD 22.5 W · USB-A 18 W" },
      { label: "Input", value: "USB-C 18 W" },
      { label: "Ports", value: "1 × USB-C, 2 × USB-A" },
      { label: "In the box", value: "Power bank, USB-C cable, guide" },
    ],
    warranty: {
      short: "6-month seller warranty",
      returnsShort: "Replacement if faulty within 7 days",
      items: [
        {
          icon: "shield-check",
          title: "6-month warranty",
          detail: "Repair or replacement by Waafa International.",
        },
        { icon: "rotate-ccw", title: "Faulty on arrival?", detail: "We replace it within 7 days." },
        STANDARD_DELIVERY,
      ],
    },
    images: [photo("prod-powerbank")],
    options: [
      {
        key: "capacity",
        label: "Capacity",
        display: "pill",
        values: [
          { value: "10,000 mAh", hint: "About 2 phone charges" },
          { value: "20,000 mAh", hint: "About 4 phone charges" },
        ],
      },
      {
        key: "colour",
        label: "Colour",
        display: "swatch",
        values: [
          { value: "Black", swatch: "#1C1F26" },
          { value: "White", swatch: "#F4F5F7" },
        ],
      },
    ],
    variants: [
      {
        id: "pb-10k-blk",
        sku: "VLT-PB10-BLK",
        options: { capacity: "10,000 mAh", colour: "Black" },
        price: 1690,
        mrp: 1990,
        stock: 15,
      },
      {
        id: "pb-10k-wht",
        sku: "VLT-PB10-WHT",
        options: { capacity: "10,000 mAh", colour: "White" },
        price: 1690,
        mrp: 1990,
        stock: 0,
      },
      {
        id: "pb-20k-blk",
        sku: "VLT-PB20-BLK",
        options: { capacity: "20,000 mAh", colour: "Black" },
        price: 2450,
        mrp: 2990,
        stock: 18,
      },
      {
        id: "pb-20k-wht",
        sku: "VLT-PB20-WHT",
        options: { capacity: "20,000 mAh", colour: "White" },
        price: 2450,
        mrp: 2990,
        stock: 2,
      },
    ],
    defaultVariantId: "pb-20k-blk",
    collectionIds: ["col-power", "col-everyday"],
    popularity: 92,
    createdAt: "2026-09-25T10:00:00+06:00",
    status: "published",
    sample: true,
  },
  {
    id: "prod-headphones",
    slug: "sonaro-air-wireless-over-ear-headphones",
    title: "Sonaro Air Wireless Over-ear Headphones",
    shortTitle: "Sonaro Air Headphones",
    brandId: "brand-sonaro",
    categoryId: "cat-headphones",
    badges: [],
    cardSpec: "40-hour battery · 3 colours",
    highlights: [
      { icon: "battery-full", text: "40-hour battery" },
      { icon: "bluetooth", text: "Bluetooth 5.3, two devices" },
      { icon: "mic", text: "Clear calls, 2 mics" },
      { icon: "package", text: "Folds flat, case included" },
    ],
    description: [
      "Soft over-ear cushions, a 40-hour battery and Bluetooth 5.3 that stays connected to your phone and laptop at the same time.",
      "Ten minutes of charging gives about four hours of listening.",
    ],
    specs: [
      { label: "Battery", value: "Up to 40 hours" },
      { label: "Charging", value: "USB-C, 10 min for 4 h" },
      { label: "Bluetooth", value: "5.3, multipoint" },
      { label: "Weight", value: "250 g" },
      { label: "Microphones", value: "2, with noise reduction" },
      { label: "In the box", value: "Headphones, case, USB-C cable, 3.5 mm cable" },
    ],
    warranty: {
      short: "1-year seller warranty",
      returnsShort: "Replacement if faulty within 7 days",
      items: [
        {
          icon: "shield-check",
          title: "1-year warranty",
          detail: "Repair or replacement by Waafa International.",
        },
        { icon: "rotate-ccw", title: "Faulty on arrival?", detail: "We replace it within 7 days." },
        STANDARD_DELIVERY,
      ],
    },
    images: [photo("prod-headphones")],
    video: video("headphones", "Close-up on the stand"),
    options: [
      {
        key: "colour",
        label: "Colour",
        display: "swatch",
        values: [
          { value: "Studio white", swatch: "#EEEDEA" },
          { value: "Midnight black", swatch: "#1C1F26" },
          { value: "Ocean blue", swatch: "#2A5BD7" },
        ],
      },
    ],
    variants: [
      {
        id: "hp-wht",
        sku: "SNR-AIR-WHT",
        options: { colour: "Studio white" },
        price: 3890,
        mrp: 4990,
        stock: 10,
      },
      {
        id: "hp-blk",
        sku: "SNR-AIR-BLK",
        options: { colour: "Midnight black" },
        price: 3890,
        mrp: 4990,
        stock: 8,
      },
      {
        id: "hp-blu",
        sku: "SNR-AIR-BLU",
        options: { colour: "Ocean blue" },
        price: 3890,
        mrp: 4990,
        stock: 2,
      },
    ],
    defaultVariantId: "hp-wht",
    collectionIds: ["col-everyday"],
    popularity: 70,
    createdAt: "2026-09-28T10:00:00+06:00",
    status: "published",
    sample: true,
  },
];

export const collections: In<typeof CollectionSchema>[] = [
  {
    id: "col-office",
    slug: "office-essentials",
    name: "Office essentials",
    description: "Toner and supplies offices reorder every month",
    image: photo("cat-stationery"),
    rule: { type: "manual", productIds: ["prod-bd-cf280a", "prod-bd-crg070h", "prod-bd-w1510a"] },
    order: 0,
    sample: true,
  },
  {
    id: "col-under-999",
    slug: "under-999",
    name: "Under ৳999",
    description: "Useful things for under a thousand taka",
    rule: { type: "rule", maxPrice: 999 },
    order: 1,
    sample: true,
  },
  {
    id: "col-power",
    slug: "power-and-charging",
    name: "Power and charging",
    image: photo("prod-powerbank"),
    rule: { type: "rule", categoryIds: ["cat-power-banks"] },
    order: 2,
    sample: true,
  },
  {
    id: "col-everyday",
    slug: "everyday-basics",
    name: "Everyday basics",
    image: photo("prod-tshirt"),
    rule: { type: "manual", productIds: ["prod-tee", "prod-power-bank", "prod-headphones"] },
    order: 3,
    sample: true,
  },
];

export const deals: In<typeof DealSchema>[] = [
  {
    id: "deal-pb-20k",
    productId: "prod-power-bank",
    variantId: "pb-20k-blk",
    dealPrice: 2290,
    endsAt: "2026-10-31T23:59:00+06:00",
    sample: true,
  },
  {
    id: "deal-headphones",
    productId: "prod-headphones",
    variantId: "hp-blk",
    dealPrice: 3590,
    endsAt: "2026-10-20T23:59:00+06:00",
    sample: true,
  },
];

/** FR-SHOP-01 store rows in admin order; each hides itself when it has nothing to show. */
export const storeRows: In<typeof StoreRowSchema>[] = [
  { key: "campaigns", enabled: true, order: 0 },
  { key: "categories", enabled: true, order: 1 },
  { key: "collections", enabled: true, order: 2 },
  { key: "deals", enabled: true, order: 3 },
  { key: "bestSellers", enabled: true, order: 4 },
  { key: "brands", enabled: true, order: 5 },
  { key: "newArrivals", enabled: true, order: 6 },
  { key: "recentlyViewed", enabled: true, order: 7 },
  { key: "services", enabled: true, order: 8 },
  { key: "bulkBanner", enabled: true, order: 9 },
  { key: "trust", enabled: true, order: 10 },
];

export const coupons: In<typeof CouponSchema>[] = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    maxDiscount: 300,
    startsAt: "2026-10-01T00:00:00+06:00",
    enabled: true,
    sample: true,
  },
  // Expired on purpose, for the "coupon has expired" state (ShopCart-coupon board).
  {
    code: "FREESHIP",
    type: "fixed",
    value: 80,
    startsAt: "2026-09-01T00:00:00+06:00",
    endsAt: "2026-09-30T23:59:00+06:00",
    enabled: true,
    sample: true,
  },
];

const SAMPLE_ADDRESS = {
  name: "Sample Customer",
  phone: "+8801000000003",
  division: "Dhaka",
  district: "Dhaka",
  area: "Motijheel",
  street: "Sample Road 1, House 1",
};

/** Admin order samples (FR-SHOP-09). Totals add up: subtotal − discount + delivery. */
export const orders: In<typeof OrderSchema>[] = [
  {
    id: "order-1",
    reference: "ORD-261008-0042",
    items: [
      {
        productId: "prod-tee",
        variantId: "tee-wht-m",
        title: "Classic Cotton Crew T-shirt",
        variantLabel: "White · M",
        sku: "TSR-TEE-WHT-M",
        unitPrice: 650,
        quantity: 2,
        lineTotal: 1300,
      },
      {
        productId: "prod-power-bank",
        variantId: "pb-20k-blk",
        title: "Voltaro Power Bank, 22.5 W Fast Charge",
        variantLabel: "20,000 mAh · Black",
        sku: "VLT-PB20-BLK",
        unitPrice: 2450,
        quantity: 1,
        lineTotal: 2450,
      },
    ],
    subtotal: 3750,
    discount: 300,
    delivery: 0,
    total: 3450,
    couponCode: "WELCOME10",
    payment: { method: "offline", accountId: "acc-bkash", transactionId: "SAMPLE0001" },
    address: SAMPLE_ADDRESS,
    status: "placed",
    history: [{ status: "placed", at: "2026-10-08T19:18:00+06:00" }],
    createdAt: "2026-10-08T19:18:00+06:00",
    sample: true,
  },
  {
    id: "order-2",
    reference: "ORD-260921-0108",
    items: [
      {
        productId: "prod-bd-cf280a",
        variantId: "bd-cf280a",
        title: "Better Day CE505A / CF280A Black Toner",
        sku: "BD-CF280A",
        unitPrice: 1450,
        quantity: 2,
        lineTotal: 2900,
      },
    ],
    subtotal: 2900,
    discount: 0,
    delivery: 80,
    total: 2980,
    payment: { method: "cod" },
    paymentVerified: true,
    address: SAMPLE_ADDRESS,
    status: "delivered",
    history: [
      { status: "placed", at: "2026-09-21T10:05:00+06:00" },
      { status: "confirmed", at: "2026-09-21T10:40:00+06:00", note: "Confirmed by phone" },
      {
        status: "shipped",
        at: "2026-09-21T16:00:00+06:00",
        courier: "Sample courier",
        trackingNumber: "SAMPLE-TRK-0108",
      },
      { status: "delivered", at: "2026-09-22T13:30:00+06:00" },
    ],
    createdAt: "2026-09-21T10:05:00+06:00",
    sample: true,
  },
];
