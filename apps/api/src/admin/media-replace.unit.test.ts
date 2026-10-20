import { describe, expect, it } from "vitest";
import type { MediaAsset } from "../generated/prisma/client";
import { swapMedia } from "./media-replace.service";

const asset = (path: string, extra: Partial<MediaAsset> = {}): MediaAsset =>
  ({
    id: "newfile01",
    path,
    alt: "Sunset over Cox's Bazar beach",
    width: 2400,
    height: 1600,
    bytes: 1000,
    mime: path.endsWith(".webp") ? "image/webp" : "video/mp4",
    originalName: null,
    uploadedBy: null,
    credit: null,
    creditUrl: null,
    createdAt: new Date(),
    ...extra,
  }) as MediaAsset;

describe("replace everywhere (D0 R3)", () => {
  it("gives a photo the new file's words, size and credit, and drops the old focal point", () => {
    const before = {
      title: "Cox's Bazar",
      cover: {
        src: "/uploads/2026/10/oldfile01.webp",
        alt: "Old beach photo",
        width: 900,
        height: 600,
        credit: "Old photographer",
        creditUrl: "https://unsplash.com/photos/old",
        focal: { x: 20, y: 80 },
      },
      gallery: [{ src: "/uploads/2026/10/another01.webp", alt: "Kept", credit: "Someone" }],
    };
    const to = asset("2026/10/newfile01.webp", {
      credit: "Jane Doe · Unsplash",
      creditUrl: "https://unsplash.com/photos/new",
    });
    expect(swapMedia(before, "2026/10/oldfile01.webp", to)).toEqual({
      title: "Cox's Bazar",
      cover: {
        src: "/uploads/2026/10/newfile01.webp",
        alt: "Sunset over Cox's Bazar beach",
        width: 2400,
        height: 1600,
        credit: "Jane Doe · Unsplash",
        creditUrl: "https://unsplash.com/photos/new",
      },
      gallery: [{ src: "/uploads/2026/10/another01.webp", alt: "Kept", credit: "Someone" }],
    });
    // A new file without a credit takes the old one's away.
    const plain = swapMedia(before, "2026/10/oldfile01.webp", asset("2026/10/newfile01.webp"));
    expect((plain as { cover: Record<string, unknown> }).cover).not.toHaveProperty("credit");
    expect((plain as { cover: Record<string, unknown> }).cover).not.toHaveProperty("creditUrl");
  });

  it("gives a video the new clip's credit when its main file changes, not for a phone copy", () => {
    const video = {
      mp4: "/uploads/2026/10/oldclip01.mp4",
      mp4Mobile: "/uploads/2026/10/phoneclp1.mp4",
      poster: { src: "/media/photos/hero.jpg", alt: "Wing over clouds" },
      credit: "Old videographer · Pexels",
    };
    const to = asset("2026/10/newclip01.mp4", { credit: "Ray · Coverr" });
    expect(swapMedia(video, "2026/10/oldclip01.mp4", to)).toEqual({
      ...video,
      mp4: "/uploads/2026/10/newclip01.mp4",
      credit: "Ray · Coverr",
    });
    expect(swapMedia(video, "2026/10/phoneclp1.mp4", to)).toEqual({
      ...video,
      mp4Mobile: "/uploads/2026/10/newclip01.mp4",
    });
  });
});
