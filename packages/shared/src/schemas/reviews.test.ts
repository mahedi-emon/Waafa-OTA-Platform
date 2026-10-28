import { describe, expect, it } from "vitest";
import { ratingSummary, reviewerName } from "./reviews";

describe("reviews helpers (issue 245)", () => {
  it("shows only a first name and an initial", () => {
    expect(reviewerName("Karim Uddin Ahmed")).toBe("Karim A.");
    expect(reviewerName("Nadia")).toBe("Nadia");
    expect(reviewerName("  ")).toBe("Customer");
  });

  it("averages ratings to one decimal, null for none", () => {
    expect(ratingSummary([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toEqual({
      average: 4.3,
      count: 3,
    });
    expect(ratingSummary([])).toBeNull();
  });
});
