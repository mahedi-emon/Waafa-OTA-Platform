import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MEDIA_PATH, optimisePhoto, sniffImage } from "./media.service";

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
    for (const bad of ["../.env", "2026/10/../../x.webp", "2026/10/a.png", "x/y/z.webp"]) {
      expect(MEDIA_PATH.test(bad)).toBe(false);
    }
  });
});
