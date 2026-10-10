import { LeadCreateInputSchema } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { buildVisaLead, visaFees, visaFileDefaults, visaFileSchema } from "./visaLeadForm";

const TODAY = "2026-10-10";
const contact = {
  name: "Sample Nusrat Jahan",
  phoneCountry: "BD",
  phone: "01712-345678",
  email: "",
};
const messages = (result: {
  success: boolean;
  error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
}) =>
  Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]),
  );

describe("visa application", () => {
  it("needs a travel date, consent and a visit day when visiting", () => {
    const result = visaFileSchema(TODAY).safeParse({
      ...visaFileDefaults({ visaType: "tourist" }),
      visit: true,
    });
    expect(messages(result)).toEqual({
      travelDate: "travelDateRequired",
      appointmentDate: "visitDayRequired",
      consent: "consentRequired",
    });
  });

  it("rejects a past travel date and a visit after travel", () => {
    const result = visaFileSchema(TODAY).safeParse({
      ...visaFileDefaults({ visaType: "tourist" }),
      travelDate: "2026-10-01",
      consent: true,
    });
    expect(messages(result)).toEqual({ travelDate: "travelDatePast" });
    const late = visaFileSchema(TODAY).safeParse({
      ...visaFileDefaults({ visaType: "tourist" }),
      travelDate: "2026-11-01",
      visit: true,
      appointmentDate: "2026-11-05",
      consent: true,
    });
    expect(messages(late)).toEqual({ appointmentDate: "visitAfterTravel" });
  });

  it("builds a valid visa lead with document metadata only", () => {
    const values = visaFileSchema(TODAY).parse({
      ...visaFileDefaults({ visaType: "business", applicants: 2 }),
      travelDate: "2026-12-10",
      documents: [
        {
          slot: "passport-bio",
          fileName: "passport.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1_200_000,
        },
        {
          slot: "work-proof",
          fileName: "noc.pdf",
          mimeType: "application/pdf",
          sizeBytes: 400_000,
        },
      ],
      visit: true,
      appointmentDate: "2026-10-14",
      appointmentWindow: "afternoon",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildVisaLead({
        contact,
        values,
        country: { slug: "thailand", name: "Thailand" },
        page: "/visa-services/thailand/apply",
      }),
    );
    expect(lead.payload).toMatchObject({
      module: "visa",
      countrySlug: "thailand",
      visaType: "business",
      applicants: 2,
      appointmentWindow: "afternoon",
      documents: [{ kind: "passport-bio" }, { kind: "other", fileName: "noc.pdf" }],
    });
    expect(JSON.stringify(lead)).not.toContain("storageKey");
  });

  it("multiplies fees by applicants and keeps an unknown embassy fee open", () => {
    expect(visaFees({ embassyFee: 4000, serviceCharge: 3500 }, 2)).toEqual({
      embassy: 8000,
      service: 7000,
      total: 15000,
    });
    expect(visaFees({ embassyFee: null, serviceCharge: 3000 }, 3)).toEqual({
      embassy: null,
      service: 9000,
      total: null,
    });
  });
});
