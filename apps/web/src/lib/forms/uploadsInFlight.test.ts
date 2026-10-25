import { describe, expect, it } from "vitest";
import { beginUpload, uploadsInFlight } from "./uploadsInFlight";

describe("uploads in flight (issue 232)", () => {
  it("counts uploads until each one ends, once", () => {
    expect(uploadsInFlight()).toBe(false);
    const first = beginUpload();
    const second = beginUpload();
    expect(uploadsInFlight()).toBe(true);
    first();
    first();
    expect(uploadsInFlight()).toBe(true);
    second();
    expect(uploadsInFlight()).toBe(false);
  });
});
