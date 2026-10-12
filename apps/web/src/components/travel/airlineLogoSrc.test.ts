import { describe, expect, it } from "vitest";
import { airlineLogoSrc } from "./airlineLogoSrc";

describe("airlineLogoSrc (issue 156)", () => {
  it("uses the bundled mark for a known code", () => {
    expect(airlineLogoSrc({ code: "BG" })).toBe("/media/airlines/BG.png");
    expect(airlineLogoSrc({ code: "6E" })).toBe("/media/airlines/6E.png");
  });

  it("prefers the logo uploaded in Admin", () => {
    expect(airlineLogoSrc({ code: "BG", logo: { src: "/uploads/biman.webp", alt: "Biman" } })).toBe(
      "/uploads/biman.webp",
    );
  });

  it("returns null for codes without a bundled mark, so the code shows", () => {
    expect(airlineLogoSrc({ code: "2A" })).toBeNull();
    expect(airlineLogoSrc({ code: "ZZ", logo: { src: "  ", alt: "" } })).toBeNull();
  });
});
