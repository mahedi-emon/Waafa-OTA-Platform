import { describe, expect, it } from "vitest";
import { frameRatioCss, ratioOf, suggestAlt } from "./photoFrame";

describe("photo frames (D0 R3)", () => {
  it("reads a frame's aspect ratio", () => {
    expect(ratioOf("16:9")).toBeCloseTo(1.778, 3);
    expect(ratioOf("1.91:1")).toBeCloseTo(1.91, 3);
    expect(ratioOf("free")).toBeNull();
    expect(ratioOf("0:1")).toBeNull();
  });

  it("draws a photo in its frame, else in its own shape", () => {
    expect(frameRatioCss({ aspect: "4:5", minWidth: 600 })).toBe("4 / 5");
    expect(frameRatioCss({ aspect: "free", minWidth: 160 }, { width: 800, height: 200 })).toBe(
      "800 / 200",
    );
    expect(frameRatioCss(undefined)).toBe("4 / 3");
  });

  it("suggests alt text from the record's title, else the file name", () => {
    expect(suggestAlt("Bali  5 days ", "Img 2041")).toBe("Bali 5 days");
    expect(suggestAlt("", "Beach day 01")).toBe("Beach day 01");
    expect(suggestAlt(undefined, "")).toBe("Photo");
  });
});
