import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { parseRange, rawBody } from "./media.controller";
import { MEDIA_PATH, mp4Size, optimisePhoto, sniffImage, sniffVideo } from "./media.service";

async function photo(format: "jpeg" | "png", width = 3200, height = 1800) {
  const image = sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 83, b: 215 } },
  });
  return format === "jpeg"
    ? image
        .withExif({ IFD0: { Make: "PhoneMaker", Model: "X1" }, IFD3: { GPSLatitudeRef: "N" } })
        .jpeg()
        .toBuffer()
    : image.png().toBuffer();
}

describe("media library (#109)", () => {
  it("recognises photos by their bytes, not their name", async () => {
    expect(sniffImage(await photo("jpeg", 40, 30))).toBe("image/jpeg");
    expect(sniffImage(await photo("png", 40, 30))).toBe("image/png");
    expect(sniffImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffImage(Buffer.from("%PDF-1.7 something"))).toBeNull();
  });

  it("scales to 2560 px, re-encodes to WebP and drops camera and GPS data", async () => {
    const input = await photo("jpeg");
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const { data, info } = await optimisePhoto(input);
    expect(info.format).toBe("webp");
    expect(info.width).toBe(2560);
    expect(info.height).toBe(1440);
    const meta = await sharp(data).metadata();
    expect(meta.exif).toBeUndefined();
    expect(data.toString("latin1")).not.toContain("PhoneMaker");
  });

  it("never enlarges small photos and refuses unreadable files", async () => {
    const { info } = await optimisePhoto(await photo("png", 800, 600));
    expect([info.width, info.height]).toEqual([800, 600]);
    await expect(optimisePhoto(Buffer.from("not an image at all"))).rejects.toMatchObject({
      status: 422,
    });
  });

  it("only serves stored paths", () => {
    expect(MEDIA_PATH.test("2026/10/cm1abcdefgh123.webp")).toBe(true);
    expect(MEDIA_PATH.test("2026/10/cm1abcdefgh123.mp4")).toBe(true);
    expect(MEDIA_PATH.test("2026/10/cm1abcdefgh123.webm")).toBe(true);
    for (const bad of [
      "../.env",
      "2026/10/../../x.webp",
      "2026/10/a.png",
      "x/y/z.webp",
      "2026/10/ab.mov",
    ]) {
      expect(MEDIA_PATH.test(bad)).toBe(false);
    }
  });
});

describe("media library videos (D0 R3)", () => {
  const ftyp = (brand: string) =>
    Buffer.concat([
      Buffer.from([0, 0, 0, 16]),
      Buffer.from(`ftyp${brand}`, "ascii"),
      Buffer.alloc(4),
    ]);
  const tkhd = (width: number, height: number) => {
    const box = Buffer.alloc(92);
    box.writeUInt32BE(92, 0);
    box.write("tkhd", 4, "ascii");
    box.writeUInt32BE(width * 65536, 84);
    box.writeUInt32BE(height * 65536, 88);
    return box;
  };

  it("recognises MP4 and WebM by their bytes and keeps AVIF photos out", () => {
    expect(sniffVideo(ftyp("isom"))).toBe("video/mp4");
    expect(sniffVideo(ftyp("mp42"))).toBe("video/mp4");
    expect(sniffVideo(ftyp("avif"))).toBeNull();
    expect(
      sniffVideo(Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(12)])),
    ).toBe("video/webm");
    expect(sniffVideo(Buffer.from("not a video, just some text"))).toBeNull();
  });

  it("reads an MP4's width and height from its track header, or zero", () => {
    expect(mp4Size(Buffer.concat([ftyp("isom"), tkhd(1280, 720)]))).toEqual({
      width: 1280,
      height: 720,
    });
    expect(mp4Size(ftyp("isom"))).toEqual({ width: 0, height: 0 });
  });

  it("reads byte ranges so browsers can seek in a video", () => {
    expect(parseRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=500-", 1000)).toEqual({ start: 500, end: 999 });
    expect(parseRange("bytes=-200", 1000)).toEqual({ start: 800, end: 999 });
    expect(parseRange("bytes=5-2", 1000)).toBeNull();
    // Past the end: kept, so the server answers 416.
    expect(parseRange("bytes=2000-", 1000)).toEqual({ start: 2000, end: 999 });
    expect(parseRange("items=0-1", 1000)).toBeNull();
    expect(parseRange(undefined, 1000)).toBeNull();
  });

  it("takes only a raw Buffer body as an upload, never a parsed string or array", () => {
    const bytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    expect(rawBody(bytes)).toBe(bytes);
    expect(rawBody("tkhd")).toBeNull();
    expect(rawBody(["tkhd"])).toBeNull();
    expect(rawBody({ length: 4 })).toBeNull();
    expect(rawBody(null)).toBeNull();
    expect(rawBody(undefined)).toBeNull();
  });
});
