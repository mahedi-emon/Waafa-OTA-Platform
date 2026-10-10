import { LeadCreateInputSchema } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { buildBulkLead, bulkQuoteSchema } from "./bulkLeadForm";

const contact = {
  name: "Sample Rafiq Hasan",
  phoneCountry: "BD",
  phone: "01812-345678",
  email: "",
};

describe("corporate quote", () => {
  it("needs a company, a list and consent", () => {
    const result = bulkQuoteSchema.safeParse({
      company: " ",
      items: "x",
      notes: "",
      consent: false,
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "companyRequired",
      "itemsRequired",
      "consentRequired",
    ]);
  });

  it("builds a QTE lead with the product and notes", () => {
    const values = bulkQuoteSchema.parse({
      company: "Sample Traders Ltd",
      items: "20 × CF280A toner",
      notes: "Monthly delivery",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildBulkLead({
        contact,
        values,
        productSlug: "better-day-ce505a-cf280a-black-toner",
        page: "/shop",
      }),
    );
    expect(lead.payload).toEqual({
      module: "bulk",
      company: "Sample Traders Ltd",
      items: "20 × CF280A toner\n\nMonthly delivery",
      productSlug: "better-day-ce505a-cf280a-black-toner",
    });
  });
});
