import { describe, expect, it } from "vitest";
import {
  centredCrop,
  checkMediaFile,
  clampCrop,
  formatBytes,
  isTooSmall,
  mediaIdOf,
  mediaKindOf,
  mediaPathOf,
  objectPositionOf,
} from "./media";

describe("media rules (D0 R3)", () => {
  it("checks a file before it leaves the browser", () => {
    expect(checkMediaFile({ type: "image/jpeg", size: 2_000_000 }, "photo")).toBeNull();
    expect(checkMediaFile({ type: "image/gif", size: 2_000 }, "photo")).toBe("type");
    expect(checkMediaFile({ type: "image/png", size: 13 * 1024 * 1024 }, "photo")).toBe("size");
    expect(checkMediaFile({ type: "image/png", size: 0 }, "photo")).toBe("empty");
    expect(checkMediaFile({ type: "video/mp4", size: 40 * 1024 * 1024 }, "video")).toBeNull();
    expect(checkMediaFile({ type: "video/mp4", size: 51 * 1024 * 1024 }, "video")).toBe("size");
    expect(checkMediaFile({ type: "video/quicktime", size: 1_000 }, "video")).toBe("type");
    expect(mediaKindOf("video/webm")).toBe("video");
    expect(mediaKindOf("image/webp")).toBe("photo");
  });

  it("finds the library file behind an address", () => {
    expect(mediaPathOf("/uploads/2026/10/abc12345.webp")).toBe("2026/10/abc12345.webp");
    expect(mediaPathOf("https://waafasworld.com/uploads/2026/10/abc12345.mp4?v=2")).toBe(
      "2026/10/abc12345.mp4",
    );
    expect(mediaPathOf("/media/hero/dubai.jpg")).toBeNull();
    expect(mediaPathOf("/uploads/../secret.webp")).toBeNull();
    expect(mediaIdOf("/uploads/2026/10/abc12345.webp")).toBe("abc12345");
    expect(mediaIdOf("/media/hero/dubai.jpg")).toBeNull();
  });

  it("turns a focal point into object-position and warns about small photos", () => {
    expect(objectPositionOf({ x: 30.4, y: 70 })).toBe("30% 70%");
    expect(objectPositionOf({ x: -5, y: 140 })).toBe("0% 100%");
    expect(objectPositionOf(undefined)).toBeUndefined();
    expect(isTooSmall({ width: 1200, height: 800 }, { width: 1600 })).toBe(true);
    expect(isTooSmall({ width: 2000, height: 800 }, { width: 1600 })).toBe(false);
    expect(isTooSmall({ width: 2000, height: 800 }, { height: 900 })).toBe(true);
    expect(isTooSmall({ width: 10, height: 10 }, {})).toBe(false);
  });

  it("keeps a crop inside the photo and centres a default crop on the focal point", () => {
    expect(
      clampCrop({ x: -20, y: 900, width: 5000, height: 300.6 }, { width: 1600, height: 1000 }),
    ).toEqual({ x: 0, y: 699, width: 1600, height: 301 });
    expect(clampCrop({ x: 10, y: 10, width: 2, height: 2 }, { width: 100, height: 100 })).toEqual({
      x: 10,
      y: 10,
      width: 16,
      height: 16,
    });
    // 16:9 out of a 4:3 photo, kept to the right where the focal point is.
    expect(centredCrop({ width: 1600, height: 1200 }, 16 / 9, { x: 90, y: 50 })).toEqual({
      x: 0,
      y: 150,
      width: 1600,
      height: 900,
    });
    expect(centredCrop({ width: 1600, height: 900 }, 1, { x: 90, y: 50 })).toEqual({
      x: 700,
      y: 0,
      width: 900,
      height: 900,
    });
  });

  it("says file sizes in plain words", () => {
    expect(formatBytes(850 * 1024)).toBe("850 KB");
    expect(formatBytes(3.42 * 1024 * 1024)).toBe("3.4 MB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2 MB");
    expect(formatBytes(10)).toBe("1 KB");
  });
});
