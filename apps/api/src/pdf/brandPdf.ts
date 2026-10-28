import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { formatTaka } from "@waafa/shared";

/** Brand colours (PRD §16), the same values as the web tokens. */
export const COLOUR = {
  midnight: "#020D39",
  navy: "#00185B",
  brand: "#003FBE",
  sky: "#0D8CEE",
  cyan: "#39CCE9",
  ink: "#0E1424",
  mist600: "#556078",
  mist200: "#E3E8F0",
  mist50: "#F6F8FB",
  success: "#0B7A54",
} as const;

export const PAGE = { width: 595.28, height: 841.89, margin: 48 };
export const CONTENT = PAGE.width - PAGE.margin * 2;

/**
 * The fonts and logo ship in apps/api/assets: next to src/ in development and tests, next to dist/ in the image
 * (the working folder in both).
 */
function assetsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), "assets"),
    path.resolve(here, "../assets"),
    path.resolve(here, "../../assets"),
  ];
  const found = candidates.find((dir) => existsSync(path.join(dir, "fonts", "inter-400.woff")));
  if (!found) throw new Error("PDF assets are missing (apps/api/assets)");
  return found;
}

/** The Latin fonts have no arrow; route summaries use one ("DAC → DXB"). */
export const printable = (text: string) => text.replace(/→/g, "–").replace(/\s+/g, " ").trim();

/** Text with Bangla letters prints in Hind Siliguri (the Latin fonts have none). */
export const fontFor = (text: string, latin: string) => (/[ঀ-৿]/.test(text) ? "taka" : latin);

export type BrandPdf = {
  doc: PDFKit.PDFDocument;
  /** The finished file, once `doc.end()` is called. */
  done: Promise<Buffer>;
  /** Where the page content starts under the header. */
  top: number;
  /** "৳1,46,480" (or a given formatted amount) drawn at x, y: the sign in the taka font. */
  money: (amount: number | string, x: number, y: number, font: string, size: number) => void;
  moneyWidth: (amount: number | string, font: string, size: number) => number;
};

/**
 * An A4 document with the WAAFA header (the logo on white, a label and a reference on the right, the ribbon under
 * both), Inter and Plus Jakarta Sans, the taka sign from Hind Siliguri. Shared by quotes, invoices and packing slips.
 */
export function startBrandPdf(options: {
  title: string;
  subject: string;
  author: string;
  label: string;
  reference: string;
}): BrandPdf {
  const assets = assetsDir();
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    bufferPages: true,
    info: { Title: options.title, Author: options.author, Subject: printable(options.subject) },
  });
  doc.registerFont("body", path.join(assets, "fonts", "inter-400.woff"));
  doc.registerFont("strong", path.join(assets, "fonts", "inter-600.woff"));
  doc.registerFont("display", path.join(assets, "fonts", "plus-jakarta-sans-700.woff"));
  doc.registerFont("taka", path.join(assets, "fonts", "hind-siliguri-600-bengali.woff"));

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // A formatted amount may start with a minus ("-৳1,000"): it goes before the sign.
  const partsOf = (amount: number | string) => {
    const text = typeof amount === "number" ? formatTaka(amount) : amount;
    return {
      minus: text.startsWith("-") ? "-" : "",
      figures: text.replace(/^-/, "").replace("৳", ""),
    };
  };
  const moneyWidth = (amount: number | string, font: string, size: number) => {
    const { minus, figures } = partsOf(amount);
    return (
      doc
        .font(font)
        .fontSize(size)
        .widthOfString(minus + figures) + doc.font("taka").fontSize(size).widthOfString("৳")
    );
  };
  const money = (amount: number | string, x: number, y: number, font: string, size: number) => {
    const { minus, figures } = partsOf(amount);
    const lead = minus ? doc.font(font).fontSize(size).widthOfString(minus) : 0;
    if (minus) doc.text(minus, x, y, { lineBreak: false });
    doc
      .font("taka")
      .fontSize(size)
      .text("৳", x + lead, y, { lineBreak: false });
    const sign = doc.widthOfString("৳");
    doc
      .font(font)
      .fontSize(size)
      .text(figures, x + lead + sign, y, { lineBreak: false });
  };

  const top = PAGE.margin;
  doc.image(path.join(assets, "brand", "waafa-mark.png"), PAGE.margin, top, { height: 34 });
  doc.image(path.join(assets, "brand", "waafa-wordmark.png"), PAGE.margin + 62, top + 10, {
    height: 15,
  });
  doc
    .fillColor(COLOUR.mist600)
    .font("strong")
    .fontSize(9)
    .text(options.label.toUpperCase(), PAGE.margin, top + 2, {
      width: CONTENT,
      align: "right",
      characterSpacing: 1.5,
    });
  doc
    .fillColor(COLOUR.navy)
    .font("display")
    .fontSize(15)
    .text(options.reference, PAGE.margin, top + 14, { width: CONTENT, align: "right" });
  const ribbonY = top + 48;
  const ribbon = doc.linearGradient(PAGE.margin, 0, PAGE.margin + CONTENT, 0);
  ribbon
    .stop(0, COLOUR.midnight)
    .stop(0.4, COLOUR.brand)
    .stop(0.75, COLOUR.sky)
    .stop(1, COLOUR.cyan);
  doc.rect(PAGE.margin, ribbonY, CONTENT, 3).fill(ribbon);

  return { doc, done, top: ribbonY + 22, money, moneyWidth };
}

/** The footer on every page: a rule, a note, the business line and page numbers. */
export function brandFooter(doc: PDFKit.PDFDocument, note: string, business: string) {
  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page += 1) {
    doc.switchToPage(page);
    const footY = PAGE.height - PAGE.margin - 66;
    doc
      .moveTo(PAGE.margin, footY)
      .lineTo(PAGE.margin + CONTENT, footY)
      .lineWidth(0.75)
      .strokeColor(COLOUR.mist200)
      .stroke();
    doc
      .fillColor(COLOUR.mist600)
      .font("body")
      .fontSize(8.5)
      .text(note, PAGE.margin, footY + 10, { width: CONTENT, lineGap: 1.5, lineBreak: true });
    doc
      .fillColor(COLOUR.ink)
      .font("strong")
      .fontSize(9)
      .text(business, PAGE.margin, footY + 40, { width: CONTENT - 60, lineBreak: false });
    doc
      .fillColor(COLOUR.mist600)
      .font("body")
      .fontSize(8.5)
      .text(`${page - range.start + 1} of ${range.count}`, PAGE.margin, footY + 40, {
        width: CONTENT,
        align: "right",
        lineBreak: false,
      });
  }
}
