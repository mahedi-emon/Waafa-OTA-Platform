import { describe, expect, it } from "vitest";
import { shareImageSrc, sharePreview } from "./imageQuality";

describe("shareImageSrc (issue 185)", () => {
  it("sends site photos and uploads through the optimiser at 1200 px", () => {
    expect(shareImageSrc("/media/photos/nepal.jpg")).toBe(
      "/_next/image?url=%2Fmedia%2Fphotos%2Fnepal.jpg&w=1200&q=65",
    );
    expect(shareImageSrc("/uploads/2026/10/abcdefgh12.webp")).toBe(
      "/_next/image?url=%2Fuploads%2F2026%2F10%2Fabcdefgh12.webp&w=1200&q=65",
    );
  });

  it("leaves other addresses and already optimised ones alone", () => {
    for (const src of [
      "https://example.com/photo.jpg",
      "//cdn.example.com/photo.jpg",
      "/_next/image?url=%2Fa.jpg&w=1200&q=65",
    ]) {
      expect(shareImageSrc(src)).toBe(src);
    }
  });
});

describe("sharePreview", () => {
  it("scales the declared size to the share width", () => {
    expect(
      sharePreview({ url: "/media/photos/nepal.jpg", alt: "Nepal", width: 1600, height: 2400 }),
    ).toEqual({
      url: "/_next/image?url=%2Fmedia%2Fphotos%2Fnepal.jpg&w=1200&q=65",
      alt: "Nepal",
      width: 1200,
      height: 1800,
    });
  });

  it("keeps the size of a smaller photo, which is never enlarged, and of an outside image", () => {
    expect(
      sharePreview({ url: "/media/photos/sajek.jpg", alt: "", width: 900, height: 506 }),
    ).toMatchObject({ width: 900, height: 506 });
    const outside = { url: "https://example.com/a.jpg", alt: "", width: 2000, height: 1000 };
    expect(sharePreview(outside)).toEqual(outside);
  });

  it("is safe to apply twice", () => {
    const once = sharePreview({
      url: "/media/photos/visa.jpg",
      alt: "",
      width: 1600,
      height: 1067,
    });
    expect(sharePreview(once)).toEqual(once);
  });
});
