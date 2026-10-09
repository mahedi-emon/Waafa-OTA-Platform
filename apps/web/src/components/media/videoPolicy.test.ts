import { describe, expect, it } from "vitest";
import { canAutoplayVideo } from "./videoPolicy";

describe("canAutoplayVideo", () => {
  it("plays on a normal connection", () => {
    expect(canAutoplayVideo({ effectiveType: "4g" }, false)).toBe(true);
    expect(canAutoplayVideo(undefined, false)).toBe(true);
  });

  it("never plays under reduced motion", () => {
    expect(canAutoplayVideo({ effectiveType: "4g" }, true)).toBe(false);
  });

  it("respects Save-Data", () => {
    expect(canAutoplayVideo({ saveData: true, effectiveType: "4g" }, false)).toBe(false);
  });

  it("skips slow connections", () => {
    for (const effectiveType of ["slow-2g", "2g", "3g"]) {
      expect(canAutoplayVideo({ effectiveType }, false)).toBe(false);
    }
  });
});
