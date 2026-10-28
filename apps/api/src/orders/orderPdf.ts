import {
  brandFooter,
  COLOUR,
  CONTENT,
  fontFor,
  PAGE,
  printable,
  startBrandPdf,
} from "../pdf/brandPdf";
import type { InvoiceModel, PackingSlipModel } from "./orderDocuments";

type Doc = PDFKit.PDFDocument;

/** Room left above the footer before a new page starts. */
const BOTTOM = PAGE.height - 150;

/** A small caps label with lines under it, at x; returns where it ended. */
function block(doc: Doc, label: string, lines: string[], x: number, y: number, width: number) {
  doc
    .fillColor(COLOUR.mist600)
    .font("strong")
    .fontSize(8.5)
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 1 });
  lines.forEach((line, index) => {
    doc
      .fillColor(COLOUR.ink)
      .font(fontFor(line, index === 0 ? "strong" : "body"))
      .fontSize(index === 0 ? 11 : 10)
      .text(printable(line), x, doc.y + 2, { width });
  });
  return doc.y;
}

/** The facts on the right of the first block ("Invoice no.", "Order date"). */
function facts(doc: Doc, rows: Array<[string, string]>, y: number) {
  rows.forEach(([label, value], index) => {
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
  return y + rows.length * 30;
}

/** A table header row with a rule under it. */
function tableHead(
  doc: Doc,
  columns: Array<{ label: string; x: number; width: number; align?: "right" }>,
  y: number,
) {
  for (const column of columns) {
    doc
      .fillColor(COLOUR.mist600)
      .font("strong")
      .fontSize(8.5)
      .text(column.label.toUpperCase(), column.x, y, {
        width: column.width,
        characterSpacing: 0.8,
        ...(column.align ? { align: column.align } : {}),
      });
  }
  const ruleY = y + 16;
  doc
    .moveTo(PAGE.margin, ruleY)
    .lineTo(PAGE.margin + CONTENT, ruleY)
    .lineWidth(0.75)
    .strokeColor(COLOUR.mist200)
    .stroke();
  return ruleY + 8;
}

/** Height of a line's title and detail in the given width. */
function lineHeight(doc: Doc, line: { title: string; detail: string }, width: number) {
  doc.font(fontFor(line.title, "strong")).fontSize(10.5);
  const title = doc.heightOfString(printable(line.title), { width });
  doc.font("body").fontSize(9);
  return title + 2 + doc.heightOfString(printable(line.detail), { width }) + 10;
}

/**
 * The invoice PDF (issue 248): the WAAFA header with "Invoice" (or "VAT invoice") and the order reference, Bill to
 * and Ship to, the lines, the totals in taka, the VAT note, the payment and the seller's contacts.
 */
export function renderInvoicePdf(model: InvoiceModel): Promise<Buffer> {
  const { doc, done, top, money, moneyWidth } = startBrandPdf({
    title: `${model.title} ${model.reference}`,
    subject: `${model.title} for order ${model.reference}`,
    author: "Waafa International",
    label: model.title,
    reference: model.reference,
  });
  const half = (CONTENT - 24) / 2;
  const leftEnd = block(doc, "Bill to", model.billTo, PAGE.margin, top, half * 0.95);
  const factsEnd = facts(doc, model.facts, top);
  let y = Math.max(leftEnd, factsEnd) + 18;
  y = Math.max(block(doc, "Ship to", model.shipTo, PAGE.margin, y, half), doc.y) + 22;

  const qtyWidth = 40;
  const amountWidth = 90;
  const itemWidth = CONTENT - qtyWidth - amountWidth * 2 - 24;
  const qtyX = PAGE.margin + itemWidth + 8;
  const unitX = qtyX + qtyWidth + 8;
  const totalX = unitX + amountWidth + 8;
  const columns = [
    { label: "Item", x: PAGE.margin, width: itemWidth },
    { label: "Qty", x: qtyX, width: qtyWidth, align: "right" as const },
    { label: "Unit price", x: unitX, width: amountWidth, align: "right" as const },
    { label: "Amount", x: totalX, width: amountWidth, align: "right" as const },
  ];
  y = tableHead(doc, columns, y);
  const right = (amount: string, x: number, rowY: number, font: string, size: number) =>
    money(amount, x + amountWidth - moneyWidth(amount, font, size), rowY, font, size);
  for (const line of model.lines) {
    const height = lineHeight(doc, line, itemWidth);
    if (y + height > BOTTOM) {
      doc.addPage();
      y = tableHead(doc, columns, PAGE.margin);
    }
    doc
      .fillColor(COLOUR.ink)
      .font(fontFor(line.title, "strong"))
      .fontSize(10.5)
      .text(printable(line.title), PAGE.margin, y, { width: itemWidth });
    doc
      .fillColor(COLOUR.mist600)
      .font("body")
      .fontSize(9)
      .text(printable(line.detail), PAGE.margin, doc.y + 2, { width: itemWidth });
    doc
      .fillColor(COLOUR.ink)
      .font("body")
      .fontSize(10.5)
      .text(String(line.quantity), qtyX, y, { width: qtyWidth, align: "right" });
    right(line.unit, unitX, y, "body", 10.5);
    right(line.total, totalX, y, "strong", 10.5);
    y += height;
  }

  // Totals on the right, the VAT note and the payment under them.
  if (y + model.totals.length * 20 + 90 > BOTTOM) {
    doc.addPage();
    y = PAGE.margin;
  }
  doc
    .moveTo(unitX, y)
    .lineTo(PAGE.margin + CONTENT, y)
    .lineWidth(0.75)
    .strokeColor(COLOUR.mist200)
    .stroke();
  y += 10;
  for (const row of model.totals) {
    const size = row.strong ? 13 : 10.5;
    const font = row.strong ? "display" : "body";
    doc
      .fillColor(row.strong ? COLOUR.navy : COLOUR.mist600)
      .font(row.strong ? "strong" : "body")
      .fontSize(row.strong ? 11 : 10)
      .text(row.label, PAGE.margin, y + (row.strong ? 2 : 0), {
        width: unitX + amountWidth - PAGE.margin,
        align: "right",
      });
    doc.fillColor(row.strong ? COLOUR.navy : COLOUR.ink);
    right(row.amount, totalX, y, font, size);
    y += row.strong ? 24 : 18;
  }
  doc
    .fillColor(COLOUR.mist600)
    .font("body")
    .fontSize(9.5)
    .text(model.vat, PAGE.margin, y + 2, { width: CONTENT, align: "right" });
  y = doc.y + 18;
  block(doc, "Payment", [model.payment], PAGE.margin, y, CONTENT);
  y = doc.y + 18;
  block(doc, "Sold by", model.seller, PAGE.margin, y, CONTENT);

  brandFooter(doc, model.footer, model.seller[0] ?? "Waafa International");
  doc.end();
  return done;
}

/**
 * The packing slip PDF (issue 248): Ship to with the phone, the lines with SKU and quantity and a box to tick, the
 * number of units, the delivery note and, for cash on delivery, the cash to collect. No prices.
 */
export function renderPackingSlipPdf(model: PackingSlipModel): Promise<Buffer> {
  const { doc, done, top, money, moneyWidth } = startBrandPdf({
    title: `${model.title} ${model.reference}`,
    subject: `${model.title} for order ${model.reference}`,
    author: "Waafa International",
    label: model.title,
    reference: model.reference,
  });
  const leftEnd = block(doc, "Ship to", model.shipTo, PAGE.margin, top, CONTENT * 0.6);
  let y = Math.max(leftEnd, facts(doc, model.facts, top)) + 22;
  if (model.collect) {
    doc.roundedRect(PAGE.margin, y, CONTENT, 40, 8).fill(COLOUR.mist50);
    doc
      .fillColor(COLOUR.navy)
      .font("strong")
      .fontSize(11)
      .text("Cash to collect on delivery", PAGE.margin + 16, y + 14, { lineBreak: false });
    const width = moneyWidth(model.collect, "display", 15);
    money(model.collect, PAGE.margin + CONTENT - 16 - width, y + 11, "display", 15);
    y += 56;
  }

  const boxWidth = 24;
  const qtyWidth = 50;
  const itemX = PAGE.margin + boxWidth + 8;
  const itemWidth = CONTENT - boxWidth - qtyWidth - 16;
  const qtyX = PAGE.margin + CONTENT - qtyWidth;
  const columns = [
    { label: "Packed", x: PAGE.margin, width: boxWidth + 40 },
    { label: "Item", x: itemX + 24, width: itemWidth - 24 },
    { label: "Qty", x: qtyX, width: qtyWidth, align: "right" as const },
  ];
  y = tableHead(doc, columns, y);
  for (const line of model.lines) {
    const height = lineHeight(doc, line, itemWidth - 24);
    if (y + height > BOTTOM) {
      doc.addPage();
      y = tableHead(doc, columns, PAGE.margin);
    }
    doc
      .rect(PAGE.margin + 2, y, 12, 12)
      .lineWidth(1)
      .strokeColor(COLOUR.mist600)
      .stroke();
    doc
      .fillColor(COLOUR.ink)
      .font(fontFor(line.title, "strong"))
      .fontSize(10.5)
      .text(printable(line.title), itemX + 24, y, { width: itemWidth - 24 });
    doc
      .fillColor(COLOUR.mist600)
      .font("body")
      .fontSize(9)
      .text(printable(line.detail), itemX + 24, doc.y + 2, { width: itemWidth - 24 });
    doc
      .fillColor(COLOUR.ink)
      .font("display")
      .fontSize(13)
      .text(String(line.quantity), qtyX, y, { width: qtyWidth, align: "right" });
    y += height;
  }
  doc
    .fillColor(COLOUR.navy)
    .font("strong")
    .fontSize(10.5)
    .text(
      `${model.units} ${model.units === 1 ? "unit" : "units"} in this order`,
      PAGE.margin,
      y + 6,
      {
        width: CONTENT,
        align: "right",
      },
    );
  if (model.note) block(doc, "Delivery note", [model.note], PAGE.margin, doc.y + 18, CONTENT);

  brandFooter(
    doc,
    "Check every line before you seal the box. Questions about this order: call or WhatsApp the number on our website.",
    "Waafa International · Waafa’s World",
  );
  doc.end();
  return done;
}
