import { formatDate, type QuoteOption } from "@waafa/shared";
import {
  brandFooter,
  COLOUR,
  CONTENT,
  fontFor,
  PAGE,
  printable,
  startBrandPdf,
} from "../pdf/brandPdf";

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
 * The branded quote PDF (issue 298): the WAAFA logo, the customer, the options with baggage and a price in taka
 * (lakh grouping, VAT included), the last valid day, and the reminder that fares are indicative until an expert
 * confirms them. A4, Inter and Plus Jakarta Sans, the taka sign from Hind Siliguri.
 */
export function renderQuotePdf(data: QuotePdfData): Promise<Buffer> {
  const { doc, done, top, money, moneyWidth } = startBrandPdf({
    title: `Quote ${data.reference}`,
    subject: data.summary,
    author: "Waafa Tours and Travel",
    label: "Quote",
    reference: data.reference,
  });

  // Who it is for and how long it holds.
  let y = top;
  doc.fillColor(COLOUR.mist600).font("body").fontSize(10).text(`Prepared for`, PAGE.margin, y);
  doc
    .fillColor(COLOUR.ink)
    // A name written in Bangla prints in Hind Siliguri (the Latin fonts have no Bangla letters).
    .font(fontFor(data.customerName, "display"))
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
  brandFooter(
    doc,
    "Prices are in taka for everyone travelling, VAT included. Fares and rooms are indicative until our travel expert confirms them with the airline or hotel before payment.",
    `Waafa Tours and Travel · ${data.contact.phone} · ${data.contact.email} · ${data.contact.website}`,
  );
  doc.end();
  return done;
}
