import { LeadCreateInputSchema } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { buildEmiLead, emiRequestSchema } from "./emiLeadForm";

const contact = {
  name: "Sample Rahim",
  phoneCountry: "BD",
  phone: "01712-345678",
  email: "",
};

describe("EMI request (issue 233)", () => {
  const schema = emiRequestSchema(10000);
  const messages = (values: Record<string, unknown>) => {
    const parsed = schema.safeParse(values);
    return parsed.success
      ? {}
      : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]));
  };

  it("needs an amount over the minimum, the months, a bank choice and consent", () => {
    expect(messages({ amount: "", tenureMonths: "", bank: "", notes: "", consent: false })).toEqual(
      {
        amount: "amountRequired",
        tenureMonths: "monthsRequired",
        bank: "bankRequired",
        consent: "consentRequired",
      },
    );
    expect(
      messages({ amount: "৳9,500", tenureMonths: "6", bank: "unsure", notes: "", consent: true }),
    ).toEqual({ amount: "amountBelowMinimum" });
  });

  it("builds a valid EMI lead with the bank's name", () => {
    const values = schema.parse({
      amount: "1,46,480",
      tenureMonths: "6",
      bank: "city",
      notes: " Bali package ",
      consent: true,
    });
    const lead = buildEmiLead({ contact, values, bankName: "City Bank", page: "/emi" });
    expect(LeadCreateInputSchema.safeParse(lead).success).toBe(true);
    expect(lead.payload).toEqual({
      module: "emi",
      bank: "City Bank",
      amount: 146480,
      tenureMonths: 6,
      notes: "Bali package",
    });
  });
});
