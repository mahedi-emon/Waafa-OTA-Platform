import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { formatDate, formatTaka, type QuoteOption } from "@waafa/shared";

/** Brand colours (PRD §16), the same values as the web tokens. */
const COLOUR = {
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

export type QuotePdfData = {
  reference: string;
  issuedAt: Date;
  customerName: string;
  summary: string;
  validUntil: string;
  options: QuoteOption[];
  notes: string | null;
  acceptedOptionId: string | null;
  contact: { phone: string; email: string; website: string };
};

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
const printable = (text: string) => text.replace(/→/g, "–").replace(/\s+/g, " ").trim();

const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const CONTENT = PAGE.width - PAGE.margin * 2;

/**
 * The branded quote PDF (issue 298): the WAAFA logo, the customer, the options with baggage and a price in taka
 * (lakh grouping, VAT included), the last valid day, and the reminder that fares are indicative until an expert
 * confirms them. A4, Inter and Plus Jakarta Sans, the taka sign from Hind Siliguri.
 */
export function renderQuotePdf(data: QuotePdfData): Promise<Buffer> {
  const assets = assetsDir();
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    bufferPages: true,
    info: {
      Title: `Quote ${data.reference}`,
      Author: "Waafa Tours and Travel",
      Subject: printable(data.summary),
    },
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

  /** "৳1,46,480": the sign in the taka font, the figures in the given font. Returns the width drawn. */
  const moneyWidth = (amount: number, font: string, size: number) => {
    const figures = formatTaka(amount).replace("৳", "");
    return (
      doc.font("taka").fontSize(size).widthOfString("৳") +
      doc.font(font).fontSize(size).widthOfString(figures)
    );
  };
  const money = (amount: number, x: number, y: number, font: string, size: number) => {
    const figures = formatTaka(amount).replace("৳", "");
    doc.font("taka").fontSize(size).text("৳", x, y, { lineBreak: false });
    const sign = doc.widthOfString("৳");
    doc
      .font(font)
      .fontSize(size)
      .text(figures, x + sign, y, { lineBreak: false });
  };

  // Header: the logo on white, the quote's reference on the right, the ribbon under both.
  const top = PAGE.margin;
  doc.image(path.join(assets, "brand", "waafa-mark.png"), PAGE.margin, top, { height: 34 });
  doc.image(path.join(assets, "brand", "waafa-wordmark.png"), PAGE.margin + 62, top + 10, {
    height: 15,
  });
  doc
    .fillColor(COLOUR.mist600)
    .font("strong")
    .fontSize(9)
    .text("QUOTE", PAGE.margin, top + 2, { width: CONTENT, align: "right", characterSpacing: 1.5 });
  doc
    .fillColor(COLOUR.navy)
    .font("display")
    .fontSize(15)
    .text(data.reference, PAGE.margin, top + 14, { width: CONTENT, align: "right" });
  const ribbonY = top + 48;
  const ribbon = doc.linearGradient(PAGE.margin, 0, PAGE.margin + CONTENT, 0);
  ribbon
    .stop(0, COLOUR.midnight)
    .stop(0.4, COLOUR.brand)
    .stop(0.75, COLOUR.sky)
    .stop(1, COLOUR.cyan);
  doc.rect(PAGE.margin, ribbonY, CONTENT, 3).fill(ribbon);

  // Who it is for and how long it holds.
  let y = ribbonY + 22;
  doc.fillColor(COLOUR.mist600).font("body").fontSize(10).text(`Prepared for`, PAGE.margin, y);
  doc
    .fillColor(COLOUR.ink)
    // A name written in Bangla prints in Hind Siliguri (the Latin fonts have no Bangla letters).
    .font(/[\u0980-\u09FF]/.test(data.customerName) ? "taka" : "display")
    .fontSize(20)
    .text(printable(data.customerName), PAGE.margin, y + 13, { width: CONTENT * 0.62 });
  doc
    .fillColor(COLOUR.mist600)
    .font("body")
    .fontSize(10)
    .text(printable(data.summary), PAGE.margin, doc.y + 2, { width: CONTENT * 0.62 });
  const facts: Array<[string, string]> = [
    ["Issued", formatDate(data.issuedAt)],
    ["Valid until", formatDate(`${data.validUntil}T12:00:00+06:00`)],
  ];
  facts.forEach(([label, value], index) => {
    const factY = y + index * 30;
    doc
      .fillColor(COLOUR.mist600)
      .font("body")
      .fontSize(9)
      .text(label, PAGE.margin, factY, { width: CONTENT, align: "right" });
    doc
      .fillColor(COLOUR.ink)
      .font("strong")
      .fontSize(11)
      .text(value, PAGE.margin, factY + 11, { width: CONTENT, align: "right" });
  });
  y = Math.max(doc.y, y + 60) + 22;

  // The options, one card each.
  doc
    .fillColor(COLOUR.navy)
    .font("display")
    .fontSize(13)
    .text(data.options.length === 1 ? "Your option" : "Your options", PAGE.margin, y);
  y = doc.y + 10;
  const priceColumn = 150;
  const textWidth = CONTENT - priceColumn - 32;
  for (const [index, option] of data.options.entries()) {
    const accepted = option.id === data.acceptedOptionId;
    const lines = [
      option.details ? printable(option.details) : null,
      option.baggage ? `Baggage: ${printable(option.baggage)}` : null,
    ].filter((line): line is string => Boolean(line));
    doc.font("strong").fontSize(12);
    const titleHeight = doc.heightOfString(printable(option.title), { width: textWidth });
    doc.font("body").fontSize(10);
    const bodyHeight = lines.reduce(
      (sum, line) => sum + doc.heightOfString(line, { width: textWidth }) + 3,
      0,
    );
    const height = Math.max(64, 16 + 14 + titleHeight + 4 + bodyHeight + 14);
    if (y + height > PAGE.height - 150) {
      doc.addPage();
      y = PAGE.margin;
    }
    doc
      .roundedRect(PAGE.margin, y, CONTENT, height, 8)
      .lineWidth(accepted ? 1.5 : 0.75)
      .fillAndStroke(
        accepted ? COLOUR.mist50 : "#FFFFFF",
        accepted ? COLOUR.success : COLOUR.mist200,
      );
    const x = PAGE.margin + 16;
    doc
      .fillColor(accepted ? COLOUR.success : COLOUR.mist600)
      .font("strong")
      .fontSize(8.5)
      .text(accepted ? `OPTION ${index + 1} · ACCEPTED` : `OPTION ${index + 1}`, x, y + 14, {
        width: textWidth,
        characterSpacing: 1,
      });
    doc
      .fillColor(COLOUR.ink)
      .font("strong")
      .fontSize(12)
      .text(printable(option.title), x, doc.y + 3, { width: textWidth });
    for (const line of lines) {
      doc
        .fillColor(COLOUR.mist600)
        .font("body")
        .fontSize(10)
        .text(line, x, doc.y + 3, { width: textWidth });
    }
    const width = moneyWidth(option.price, "display", 16);
    doc.fillColor(COLOUR.navy);
    money(option.price, PAGE.margin + CONTENT - 16 - width, y + 16, "display", 16);
    doc
      .fillColor(COLOUR.mist600)
      .font("body")
      .fontSize(8.5)
      .text("VAT included", PAGE.margin + CONTENT - 16 - priceColumn, y + 38, {
        width: priceColumn,
        align: "right",
      });
    y += height + 10;
  }

  if (data.notes) {
    doc.font("body").fontSize(10);
    const notesHeight = doc.heightOfString(printable(data.notes), { width: CONTENT });
    if (y + notesHeight + 30 > PAGE.height - 150) {
      doc.addPage();
      y = PAGE.margin;
    }
    doc
      .fillColor(COLOUR.navy)
      .font("display")
      .fontSize(12)
      .text("Notes", PAGE.margin, y + 6);
    doc
      .fillColor(COLOUR.ink)
      .font("body")
      .fontSize(10)
      .text(data.notes.trim(), PAGE.margin, doc.y + 4, { width: CONTENT, lineGap: 2 });
  }

  // Footer on every page: the fare rule, how to reach us, page numbers.
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
      .text(
        "Prices are in taka for everyone travelling, VAT included. Fares and rooms are indicative until our travel expert confirms them with the airline or hotel before payment.",
        PAGE.margin,
        footY + 10,
        { width: CONTENT, lineGap: 1.5, lineBreak: true },
      );
    doc
      .fillColor(COLOUR.ink)
      .font("strong")
      .fontSize(9)
      .text(
        `Waafa Tours and Travel · ${data.contact.phone} · ${data.contact.email} · ${data.contact.website}`,
        PAGE.margin,
        footY + 40,
        { width: CONTENT - 60, lineBreak: false },
      );
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
  doc.end();
  return done;
}
