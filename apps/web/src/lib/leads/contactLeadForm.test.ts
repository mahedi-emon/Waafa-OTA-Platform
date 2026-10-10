import { describe, expect, it } from "vitest";
import { LeadCreateInputSchema } from "@waafa/shared";
import { buildContactLead, contactFormSchema, type ContactFormValues } from "./contactLeadForm";

const values: ContactFormValues = {
  name: "Rahim Uddin",
  phoneCountry: "BD",
  phone: "01712-345678",
  email: "",
  topic: "visa",
  message: "Do you handle Thailand tourist visas for families?",
};

const codes = (input: ContactFormValues) => {
  const result = contactFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("contact message", () => {
  it("builds a CNT lead the shared contract accepts", () => {
    expect(codes(values)).toEqual([]);
    const lead = buildContactLead(values, "/contact");
    expect(LeadCreateInputSchema.safeParse(lead).success).toBe(true);
    expect(lead.contact.phone).toBe("+8801712345678");
    expect(lead.payload).toEqual({ module: "contact", topic: "visa", message: values.message });
  });

  it("rejects a short message, a bad phone and a bad email", () => {
    expect(codes({ ...values, message: "Hi", phone: "12", email: "nope" })).toEqual(
      expect.arrayContaining(["messageShort", "phoneInvalid", "emailInvalid"]),
    );
  });
});
