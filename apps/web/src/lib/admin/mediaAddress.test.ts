import { describe, expect, it } from "vitest";
import { isLinkablePhoto, isLinkableVideo } from "./mediaAddress";

describe("linked media addresses (D0 R3)", () => {
  it("takes site paths and Unsplash or Pexels photos over https only", () => {
    expect(isLinkablePhoto("/uploads/2026/10/abc12345.webp")).toBe(true);
    expect(isLinkablePhoto("/media/photos/bali.jpg")).toBe(true);
    expect(isLinkablePhoto("https://images.unsplash.com/photo-123?w=1600")).toBe(true);
    expect(isLinkablePhoto("https://images.pexels.com/photos/1/pexels.jpeg")).toBe(true);
    expect(isLinkablePhoto("http://images.unsplash.com/photo-123")).toBe(false);
    expect(isLinkablePhoto("https://example.com/photo.jpg")).toBe(false);
    expect(isLinkablePhoto("//images.unsplash.com/photo-123")).toBe(false);
    expect(isLinkablePhoto("javascript:alert(1)")).toBe(false);
    expect(isLinkablePhoto("photo.jpg")).toBe(false);
  });

  it("takes site paths and https addresses for videos", () => {
    expect(isLinkableVideo("/uploads/2026/10/abc12345.mp4")).toBe(true);
    expect(isLinkableVideo("https://videos.pexels.com/video-files/1/clip.mp4")).toBe(true);
    expect(isLinkableVideo("http://example.com/clip.mp4")).toBe(false);
    expect(isLinkableVideo("//example.com/clip.mp4")).toBe(false);
  });
});
