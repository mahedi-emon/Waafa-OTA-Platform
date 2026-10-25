import { describe, expect, it } from "vitest";
import {
  combinations,
  comboWords,
  newVariant,
  optionKeys,
  sameCombo,
  strayVariants,
  suggestSku,
} from "./variantMatrix";

const colour = { label: "Colour", values: [{ value: "Black" }, { value: "Cyan" }] };
const pack = { key: "pack", label: "Pack", values: [{ value: "Single" }, { value: "Twin" }] };

describe("variant matrix (D0 R8)", () => {
  it("makes keys like the save does, and every mix of values", () => {
    expect(optionKeys([colour, pack])).toEqual(["colour", "pack"]);
    expect(optionKeys([colour, { label: "Colour" }])).toEqual(["colour", "colour2"]);
    expect(combinations([colour, pack])).toEqual([
      { colour: "Black", pack: "Single" },
      { colour: "Black", pack: "Twin" },
      { colour: "Cyan", pack: "Single" },
      { colour: "Cyan", pack: "Twin" },
    ]);
    expect(combinations([])).toEqual([{}]);
    expect(combinations([colour, { label: "Size", values: [] }])).toHaveLength(2);
  });

  it("matches stored variants to their mix and finds the stray ones", () => {
    expect(sameCombo({ colour: "Black" }, { colour: "Black" })).toBe(true);
    expect(sameCombo({ colour: "Black", pack: "Twin" }, { colour: "Black" })).toBe(false);
    expect(sameCombo(undefined, {})).toBe(true);
    const stray = strayVariants(
      [colour],
      [
        { id: "a", options: { colour: "Black" } },
        { id: "b", options: { colour: "Magenta" } },
      ],
    );
    expect(stray.map((variant) => variant.id)).toEqual(["b"]);
  });

  it("names a mix and suggests unique stock codes and ids", () => {
    expect(comboWords([colour, pack], { colour: "Cyan", pack: "Twin" })).toBe("Cyan · Twin");
    expect(suggestSku("HP 26A", { colour: "Black" }, new Set())).toBe("HP-26A-BLACK");
    expect(suggestSku("HP 26A", { colour: "Black" }, new Set(["HP-26A-BLACK"]))).toBe(
      "HP-26A-BLACK-2",
    );
    const variant = newVariant(
      { colour: "Black" },
      [{ id: "hp-26a-black", sku: "HP-26A-BLACK" }],
      "HP 26A",
      2150,
    );
    expect(variant).toMatchObject({
      sku: "HP-26A-BLACK-2",
      price: 2150,
      stock: 0,
      options: { colour: "Black" },
    });
    expect(variant.id).not.toBe("hp-26a-black");
  });
});
