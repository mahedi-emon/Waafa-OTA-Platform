import { describe, expect, it } from "vitest";
import { LeadCreateInputSchema } from "@waafa/shared";
import {
  buildPrintingLead,
  buildTradingLead,
  printingStepSchema,
  tradingStepSchema,
  type PrintingStepValues,
  type TradingStepValues,
} from "./serviceLeadForm";

const contact = { name: "Rahim Uddin", phoneCountry: "BD", phone: "01712-345678", email: "" };

const printing: PrintingStepValues = {
  company: "Rahman Traders",
  service: "toner-supply",
  printers: "6 to 20",
  pages: "2,000 to 10,000",
  branches: "2 to 5",
  frequency: "monthly",
  location: "Motijheel, Dhaka",
  models: "6 × HP LaserJet Pro M404",
  notes: "",
  consent: true,
};

const trading: TradingStepValues = {
  company: "Rahman Traders",
  direction: "import",
  product: "A4 copy paper",
  quantity: "1,200",
  unit: "Cartons",
  country: "China",
  specifications: "80 gsm, 500 sheets per ream",
  targetPrice: "",
  deliveryTerms: "",
  timeline: "1 to 3 months",
  notes: "",
  consent: true,
};

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : result.error!.issues.map((issue) => issue.message);

describe("printing request", () => {
  it("accepts a complete request and builds a PRN lead the shared contract accepts", () => {
    expect(printingStepSchema.safeParse(printing).success).toBe(true);
    const lead = buildPrintingLead({
      contact,
      values: printing,
      labels: {
        printers: "Printers",
        pages: "Pages a month",
        branches: "Branches",
        models: "Models",
      },
      file: null,
      page: "/shop/printing-solutions",
    });
    expect(LeadCreateInputSchema.safeParse(lead).success).toBe(true);
    expect(lead.payload).toMatchObject({
      module: "printing",
      volume: "Printers: 6 to 20 · Pages a month: 2,000 to 10,000 · Branches: 2 to 5",
      notes: "Models: 6 × HP LaserJet Pro M404",
    });
  });

  it("asks for the company, the location and consent", () => {
    expect(
      messages(
        printingStepSchema.safeParse({ ...printing, company: "", location: "", consent: false }),
      ),
    ).toEqual(expect.arrayContaining(["companyRequired", "locationRequired", "consentRequired"]));
  });
});

describe("trading request", () => {
  it("builds a TRD lead with a numeric quantity and the optional file", () => {
    expect(tradingStepSchema.safeParse(trading).success).toBe(true);
    const lead = buildTradingLead({
      contact,
      values: { ...trading, deliveryTerms: "fob", targetPrice: "USD 2.1 per ream" },
      file: { fileName: "spec.pdf", mimeType: "application/pdf", sizeBytes: 2048 },
      page: "/shop/international-trading",
    });
    expect(LeadCreateInputSchema.safeParse(lead).success).toBe(true);
    expect(lead.payload).toMatchObject({ module: "trading", quantity: 1200, deliveryTerms: "fob" });
  });

  it("rejects a missing product, a zero quantity and a missing country", () => {
    expect(
      messages(
        tradingStepSchema.safeParse({ ...trading, product: "", quantity: "0", country: "" }),
      ),
    ).toEqual(expect.arrayContaining(["productRequired", "quantityInvalid", "countryRequired"]));
  });
});
