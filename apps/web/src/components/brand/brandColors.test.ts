import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BRAND_PALETTE, RIBBON_STOPS } from "./brandColors";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

function tokenValue(name: string): string | undefined {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  return match?.[1]?.toUpperCase();
}

describe("brand colours", () => {
  it.each(BRAND_PALETTE.map((swatch) => [swatch.name, swatch.hex] as const))(
    "%s matches app/globals.css",
    (name, hex) => {
      expect(tokenValue(name)).toBe(hex.toUpperCase());
    },
  );

  it("ribbon stops are palette colours", () => {
    const hexes = BRAND_PALETTE.map((swatch) => swatch.hex);
    for (const stop of RIBBON_STOPS) expect(hexes).toContain(stop);
  });
});
