import { describe, expect, it } from "vitest";
import { countryFlagSrc } from "./countryFlagSrc";

describe("countryFlagSrc (issue 147)", () => {
  it("maps an ISO code in any case to its flag file", () => {
    expect(countryFlagSrc("MY")).toBe("/media/flags/my.svg");
    expect(countryFlagSrc(" th ")).toBe("/media/flags/th.svg");
    expect(countryFlagSrc("BD")).toBe("/media/flags/bd.svg");
  });

  it("covers Schengen and the common non-ISO aliases", () => {
    expect(countryFlagSrc("EU")).toBe("/media/flags/eu.svg");
    expect(countryFlagSrc("UK")).toBe("/media/flags/gb.svg");
    expect(countryFlagSrc("EL")).toBe("/media/flags/gr.svg");
  });

  it("returns null for unknown or empty codes, so the two-letter mark shows", () => {
    expect(countryFlagSrc("ZZ")).toBeNull();
    expect(countryFlagSrc("")).toBeNull();
    expect(countryFlagSrc(null)).toBeNull();
    expect(countryFlagSrc("../x")).toBeNull();
  });
});
