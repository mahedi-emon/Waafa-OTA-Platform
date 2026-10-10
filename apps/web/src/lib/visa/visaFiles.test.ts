import { describe, expect, it } from "vitest";
import { MAX_VISA_FILE_BYTES, checkVisaFile, formatFileSize } from "./visaFiles";

describe("visa file checks", () => {
  it("accepts JPG, PNG and PDF up to 5 MB", () => {
    expect(checkVisaFile({ name: "passport.jpg", type: "image/jpeg", size: 1_200_000 })).toEqual({
      ok: true,
      mimeType: "image/jpeg",
    });
    expect(
      checkVisaFile({ name: "statement.pdf", type: "application/pdf", size: MAX_VISA_FILE_BYTES }),
    ).toMatchObject({
      ok: true,
    });
  });

  it("falls back to the extension when the browser gives no type", () => {
    expect(checkVisaFile({ name: "photo.PNG", type: "", size: 300_000 })).toEqual({
      ok: true,
      mimeType: "image/png",
    });
  });

  it("rejects other types, empty files and files over 5 MB", () => {
    expect(checkVisaFile({ name: "scan.heic", type: "image/heic", size: 300_000 })).toEqual({
      ok: false,
      error: "fileType",
    });
    expect(checkVisaFile({ name: "notes.docx", type: "", size: 300_000 })).toEqual({
      ok: false,
      error: "fileType",
    });
    expect(checkVisaFile({ name: "empty.pdf", type: "application/pdf", size: 0 })).toEqual({
      ok: false,
      error: "fileEmpty",
    });
    expect(
      checkVisaFile({ name: "big.pdf", type: "application/pdf", size: MAX_VISA_FILE_BYTES + 1 }),
    ).toEqual({
      ok: false,
      error: "fileSize",
    });
  });

  it("formats sizes", () => {
    expect(formatFileSize(2_516_582)).toBe("2.4 MB");
    expect(formatFileSize(839_680)).toBe("820 KB");
    expect(formatFileSize(10)).toBe("1 KB");
  });
});
