import { describe, expect, it } from "vitest";
import { altFromName } from "./uploadMedia";

describe("altFromName", () => {
  it("turns a file name into a first try at alt text", () => {
    expect(altFromName("beach-day_01.jpg")).toBe("Beach day 01");
    expect(altFromName("IMG.20261019.webp")).toBe("IMG 20261019");
    expect(altFromName("cox's  bazar sunset.png")).toBe("Cox's bazar sunset");
    expect(altFromName(".jpg")).toBe("");
  });
});
