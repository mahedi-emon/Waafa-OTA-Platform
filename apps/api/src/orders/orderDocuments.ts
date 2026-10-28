import { formatDate, formatTaka } from "@waafa/shared";

/** The order as the documents need it (the stored order with its parsed JSON fields). */
export type OrderForDocuments = {
  reference: string;
  createdAt: Date;
  items: Array<{
    title: string;
    variantLabel?: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  couponCode: string | null;
  payment: { method: string };
  paymentVerified: boolean;
  address: {
    name: string;
    phone: string;
    email?: string;
    division: string;
    district: string;
    area: string;
    street: string;
    note?: string;
  };
  pickup: boolean;
  invoice: { companyName: string; bin: string } | null;
};

/** Who sells: the company and how to reach it (never licence or ID numbers). */
export type Seller = {
  companyName: string;
  storeName: string;
  addressLines: string[];
  phone: string;
  email: string;
  website: string;
  /** The VAT rate included in the prices (Payment settings); empty = "VAT included" without an amount. */
  vatPercent?: number;
};

export type DocumentLine = {
  title: string;
  detail: string;
  quantity: number;
  unit: string;
  total: string;
};

export type InvoiceModel = {
  title: string;
  reference: string;
  facts: Array<[string, string]>;
  billTo: string[];
  shipTo: string[];
  lines: DocumentLine[];
  totals: Array<{ label: string; amount: string; strong?: boolean }>;
  vat: string;
  payment: string;
  seller: string[];
  footer: string;
};

export type PackingSlipModel = {
  title: string;
  reference: string;
  facts: Array<[string, string]>;
  shipTo: string[];
  lines: Array<{ title: string; detail: string; quantity: number }>;
  units: number;
  collect: string | null;
  note: string | null;
};

/** "+8801712345678" → "01712-345678" (how a phone is written in Bangladesh). */
export function localPhone(e164: string): string {
  const digits = e164.startsWith("+880") ? `0${e164.slice(4)}` : e164;
  return /^01\d{9}$/.test(digits) ? `${digits.slice(0, 5)}-${digits.slice(5)}` : e164;
}

const addressLines = (order: OrderForDocuments) =>
  order.pickup
    ? ["Pick-up from our office"]
    : [
        order.address.street,
        `${order.address.area}, ${order.address.district}`,
        order.address.division,
      ];

const lineDetail = (item: OrderForDocuments["items"][number]) =>
  item.variantLabel ? `${item.variantLabel} · SKU ${item.sku}` : `SKU ${item.sku}`;

/** VAT inside a VAT-inclusive total: total × rate ÷ (100 + rate), to the paisa. */
export function vatInside(total: number, percent: number): number {
  return Math.round((total * percent * 100) / (100 + percent)) / 100;
}

const paymentWords = (order: OrderForDocuments) => {
  if (order.payment.method === "cod")
    return order.paymentVerified
      ? "Cash on delivery · paid"
      : `Cash on delivery · ${formatTaka(order.total)} to pay on delivery`;
  return order.paymentVerified
    ? "Paid in advance · payment verified"
    : "Paid in advance · payment being verified";
};

/**
 * What the invoice says (issue 248), kept apart from the drawing so tests can read it: the order lines and totals in
 * taka (lakh grouping, VAT included), the VAT inside the total when a rate is set, the customer's company and BIN
 * when they asked for a VAT invoice, and the seller's name and contacts only.
 */
export function invoiceModel(order: OrderForDocuments, seller: Seller): InvoiceModel {
  const billTo = order.invoice
    ? [order.invoice.companyName, `BIN ${order.invoice.bin}`, `Attn: ${order.address.name}`]
    : [order.address.name];
  billTo.push(localPhone(order.address.phone));
  if (order.address.email) billTo.push(order.address.email);
  const totals: InvoiceModel["totals"] = [
    { label: "Subtotal", amount: formatTaka(order.subtotal) },
  ];
  if (order.discount > 0)
    totals.push({
      label: order.couponCode ? `Coupon ${order.couponCode}` : "Discount",
      amount: `-${formatTaka(order.discount)}`,
    });
  totals.push({
    label: order.pickup ? "Office pick-up" : "Delivery",
    amount: formatTaka(order.delivery),
  });
  totals.push({ label: "Total", amount: formatTaka(order.total), strong: true });
  const vat =
    seller.vatPercent && seller.vatPercent > 0
      ? `Includes VAT at ${seller.vatPercent}%: ${formatTaka(vatInside(order.total, seller.vatPercent), { decimals: 2 })}`
      : "All prices include VAT";
  return {
    title: order.invoice ? "VAT invoice" : "Invoice",
    reference: order.reference,
    facts: [
      ["Invoice no.", order.reference],
      ["Order date", formatDate(order.createdAt)],
    ],
    billTo,
    shipTo: [order.address.name, ...addressLines(order)],
    lines: order.items.map((item) => ({
      title: item.title,
      detail: lineDetail(item),
      quantity: item.quantity,
      unit: formatTaka(item.unitPrice),
      total: formatTaka(item.lineTotal),
    })),
    totals,
    vat,
    payment: paymentWords(order),
    seller: [
      `${seller.companyName} · ${seller.storeName}`,
      ...seller.addressLines,
      `${seller.phone} · ${seller.email} · ${seller.website}`,
    ],
    footer: "Prices are in taka, VAT included. Thank you for shopping with Waafa’s World.",
  };
}

/**
 * What the packing slip says (issue 248): where it goes, what goes in the box with the SKU and the quantity, no
 * prices; the cash to collect when the order is cash on delivery and not yet paid.
 */
export function packingSlipModel(order: OrderForDocuments): PackingSlipModel {
  const collect =
    order.payment.method === "cod" && !order.paymentVerified ? formatTaka(order.total) : null;
  return {
    title: "Packing slip",
    reference: order.reference,
    facts: [
      ["Order", order.reference],
      ["Order date", formatDate(order.createdAt)],
    ],
    shipTo: [order.address.name, localPhone(order.address.phone), ...addressLines(order)],
    lines: order.items.map((item) => ({
      title: item.title,
      detail: lineDetail(item),
      quantity: item.quantity,
    })),
    units: order.items.reduce((sum, item) => sum + item.quantity, 0),
    collect,
    note: order.address.note ?? null,
  };
}
