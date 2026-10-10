import { describe, expect, it } from "vitest";
import { FeedbackCreateInputSchema } from "@waafa/shared";
import { buildFeedbackInput, feedbackFormSchema, type FeedbackFormValues } from "./feedbackForm";

const values: FeedbackFormValues = {
  name: "Nadia Islam",
  phoneCountry: "BD",
  phone: "01712-345678",
  service: "packages",
  reference: "",
  rating: "",
  comment: "The Sajek trip was well planned and the guide was helpful.",
  consentToPublish: false,
};

const codes = (input: FeedbackFormValues) => {
  const result = feedbackFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("feedback form", () => {
  it("builds a contract the server accepts, without rating or reference when left empty", () => {
    expect(codes(values)).toEqual([]);
    const input = buildFeedbackInput(values, null);
    expect(FeedbackCreateInputSchema.safeParse(input).success).toBe(true);
    expect(input).not.toHaveProperty("rating");
    expect(input).not.toHaveProperty("reference");
    expect(input.phone).toBe("+8801712345678");
  });

  it("keeps a rating, an upper-cased reference and photo metadata", () => {
    const input = buildFeedbackInput(
      { ...values, rating: "5", reference: "pkg-261008-0021", consentToPublish: true },
      { fileName: "sajek.jpg", mimeType: "image/jpeg", sizeBytes: 120_000 },
    );
    expect(FeedbackCreateInputSchema.safeParse(input).success).toBe(true);
    expect(input).toMatchObject({
      rating: 5,
      reference: "PKG-261008-0021",
      consentToPublish: true,
    });
  });

  it("rejects a short comment, a bad phone and a malformed reference", () => {
    expect(codes({ ...values, comment: "Good", phone: "1", reference: "PKG-1" })).toEqual(
      expect.arrayContaining(["commentShort", "phoneInvalid", "referenceInvalid"]),
    );
  });
});
