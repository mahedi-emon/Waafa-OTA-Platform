import { describe, expect, it } from "vitest";
import {
  invoiceModel,
  localPhone,
  packingSlipModel,
  vatInside,
  type OrderForDocuments,
  type Seller,
} from "./orderDocuments";
import { renderInvoicePdf, renderPackingSlipPdf } from "./orderPdf";

const order: OrderForDocuments = {
  reference: "WW-261028-0007",
  createdAt: new Date("2026-10-28T06:00:00Z"),
  items: [
    {
      title: "Power bank 20,000 mAh",
      variantLabel: "Black",
      sku: "PB-20K-BLK",
      unitPrice: 2450,
      quantity: 2,
      lineTotal: 4900,
    },
    {
      title: "A4 paper, 80 gsm",
      sku: "PAPER-A4-80",
      unitPrice: 146480,
      quantity: 1,
      lineTotal: 146480,
    },
  ],
  subtotal: 151380,
  discount: 500,
  delivery: 120,
  total: 151000,
  couponCode: "WINTER",
  payment: { method: "cod" },
  paymentVerified: false,
  address: {
    name: "Sample Rahim",
    phone: "+8801712345678",
    email: "rahim@example.com",
    division: "Dhaka",
    district: "Dhaka",
    area: "Motijheel",
    street: "House 4, Road 2",
    note: "Call before coming",
  },
  pickup: false,
  invoice: null,
};

const seller: Seller = {
  companyName: "Waafa International",
  storeName: "Waafa’s World",
  addressLines: ["Motijheel C/A"],
  phone: "01700-000000",
  email: "hello@example.com",
  website: "example.com",
};

describe("invoice (issue 248)", () => {
  it("lists the lines and totals in taka with lakh grouping and says VAT is included", () => {
    const model = invoiceModel(order, seller);
    expect(model.title).toBe("Invoice");
    expect(model.billTo).toEqual(["Sample Rahim", "01712-345678", "rahim@example.com"]);
    expect(model.shipTo).toEqual(["Sample Rahim", "House 4, Road 2", "Motijheel, Dhaka", "Dhaka"]);
    expect(model.lines[1]).toEqual({
      title: "A4 paper, 80 gsm",
      detail: "SKU PAPER-A4-80",
      quantity: 1,
      unit: "৳1,46,480",
      total: "৳1,46,480",
    });
    expect(model.totals).toEqual([
      { label: "Subtotal", amount: "৳1,51,380" },
      { label: "Coupon WINTER", amount: "-৳500" },
      { label: "Delivery", amount: "৳120" },
      { label: "Total", amount: "৳1,51,000", strong: true },
    ]);
    expect(model.vat).toBe("All prices include VAT");
    expect(model.payment).toBe("Cash on delivery · ৳1,51,000 to pay on delivery");
  });

  it("bills the company with the customer's BIN when they asked for a VAT invoice", () => {
    const model = invoiceModel(
      { ...order, invoice: { companyName: "Sample Traders Ltd", bin: "000123456789" } },
      seller,
    );
    expect(model.title).toBe("VAT invoice");
    expect(model.billTo.slice(0, 3)).toEqual([
      "Sample Traders Ltd",
      "BIN 000123456789",
      "Attn: Sample Rahim",
    ]);
    // The seller's lines carry only the name and contacts.
    expect(model.seller.join(" ")).not.toMatch(/BIN|licen[cs]e|TIN/i);
  });

  it("works the VAT back from the total when a rate is set", () => {
    expect(vatInside(115, 15)).toBe(15);
    expect(vatInside(151000, 15)).toBe(19695.65);
    expect(invoiceModel(order, { ...seller, vatPercent: 15 }).vat).toBe(
      "Includes VAT at 15%: ৳19,695.65",
    );
  });

  it("renders an A4 PDF named after the order", async () => {
    const pdf = await renderInvoicePdf(invoiceModel(order, { ...seller, vatPercent: 15 }));
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("/MediaBox [0 0 595.28 841.89]");
    expect(text).toContain("(Invoice WW-261028-0007)");
    expect(pdf.length).toBeLessThan(600_000);
  });

  it("starts new pages for a long order", async () => {
    const long = {
      ...order,
      items: Array.from({ length: 40 }, (_, index) => ({
        ...order.items[0]!,
        sku: `SKU-${index}`,
      })),
    };
    const pdf = await renderInvoicePdf(invoiceModel(long, seller));
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(1);
  });
});

describe("packing slip (issue 248)", () => {
  it("lists what goes in the box without prices and the cash to collect", () => {
    const model = packingSlipModel(order);
    expect(model.shipTo).toEqual([
      "Sample Rahim",
      "01712-345678",
      "House 4, Road 2",
      "Motijheel, Dhaka",
      "Dhaka",
    ]);
    expect(model.lines[0]).toEqual({
      title: "Power bank 20,000 mAh",
      detail: "Black · SKU PB-20K-BLK",
      quantity: 2,
    });
    expect(JSON.stringify(model.lines)).not.toContain("৳");
    expect(model.units).toBe(3);
    expect(model.collect).toBe("৳1,51,000");
    expect(model.note).toBe("Call before coming");
  });

  it("collects nothing once paid and says when the customer picks it up", () => {
    const model = packingSlipModel({
      ...order,
      paymentVerified: true,
      pickup: true,
      address: { ...order.address, note: undefined },
    } as OrderForDocuments);
    expect(model.collect).toBeNull();
    expect(model.shipTo.slice(2)).toEqual(["Pick-up from our office"]);
  });

  it("renders a PDF", async () => {
    const pdf = await renderPackingSlipPdf(packingSlipModel(order));
    expect(pdf.toString("latin1")).toContain("(Packing slip WW-261028-0007)");
  });

  it("writes Bangladeshi numbers the local way", () => {
    expect(localPhone("+8801712345678")).toBe("01712-345678");
    expect(localPhone("+971501234567")).toBe("+971501234567");
  });
});
