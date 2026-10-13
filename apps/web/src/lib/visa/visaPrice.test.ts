import { describe, expect, it } from "vitest";
import { formatVisaPrice } from "./visaPrice";

describe("formatVisaPrice (issue 179)", () => {
  it("shows a range with lakh grouping", () => {
    expect(formatVisaPrice({ min: 7500, max: 146480 }, "From {price}")).toBe("৳7,500 – ৳1,46,480");
  });

  it("shows a starting price without a top", () => {
    expect(formatVisaPrice({ min: 7500 }, "From {price}")).toBe("From ৳7,500");
    expect(formatVisaPrice({ min: 7500, max: 7500 }, "From {price}")).toBe("From ৳7,500");
  });
});
