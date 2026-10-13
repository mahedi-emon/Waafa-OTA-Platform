import { describe, expect, it } from "vitest";
import { lowestVisaPrice, visaPrice, visaPriceFor } from "./visaPrice";

describe("visaPrice (issue 179)", () => {
  it("uses the admin range", () => {
    expect(
      visaPrice({ priceRange: { min: 7500, max: 9500 }, embassyFee: 4000, serviceCharge: 3500 }),
    ).toEqual({ min: 7500, max: 9500 });
  });

  it("treats a range without a top, or with an equal top, as a starting price", () => {
    expect(visaPrice({ priceRange: { min: 7500 }, embassyFee: 4000, serviceCharge: 3500 })).toEqual(
      { min: 7500 },
    );
    expect(
      visaPrice({ priceRange: { min: 7500, max: 7500 }, embassyFee: null, serviceCharge: 3500 }),
    ).toEqual({ min: 7500 });
  });

  it("starts from the embassy fee plus the service charge without a range", () => {
    expect(visaPrice({ embassyFee: 4000, serviceCharge: 3500 })).toEqual({ min: 7500 });
    expect(visaPrice({ embassyFee: null, serviceCharge: 3500 })).toEqual({ min: 3500 });
  });

  it("finds the lowest starting price of a country", () => {
    expect(
      lowestVisaPrice([
        { priceRange: { min: 9000, max: 12000 }, embassyFee: 0, serviceCharge: 0 },
        { embassyFee: 2000, serviceCharge: 5500 },
      ]),
    ).toBe(7500);
  });

  it("multiplies both ends for a group", () => {
    expect(visaPriceFor({ min: 7500, max: 9500 }, 3)).toEqual({ min: 22500, max: 28500 });
    expect(visaPriceFor({ min: 7500 }, 2)).toEqual({ min: 15000 });
    expect(visaPriceFor({ min: 7500 }, 0)).toEqual({ min: 7500 });
  });
});
