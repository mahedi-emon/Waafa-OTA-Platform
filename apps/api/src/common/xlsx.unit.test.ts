import { describe, expect, it } from "vitest";
import { columnName, crc32, toXlsx } from "./xlsx";

/** Reads a stored zip back: the name and text of each file, through the central directory. */
function unzip(zip: Buffer): Map<string, string> {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const files = new Map<string, string>();
  for (let i = 0; i < count; i += 1) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const offset = zip.readUInt32LE(at + 42);
    const name = zip.toString("utf8", at + 46, at + 46 + nameLength);
    const localName = zip.readUInt16LE(offset + 26);
    const start = offset + 30 + localName;
    const data = zip.subarray(start, start + size);
    expect(crc32(data)).toBe(zip.readUInt32LE(at + 16));
    files.set(name, data.toString("utf8"));
    at += 46 + nameLength;
  }
  return files;
}

describe("xlsx", () => {
  it("computes zip checksums and spreadsheet column names", () => {
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
    expect([0, 25, 26, 51, 701, 702].map(columnName)).toEqual(["A", "Z", "AA", "AZ", "ZZ", "AAA"]);
  });

  it("writes a workbook Excel can open: parts, a bold frozen header, text kept as text and numbers as numbers", () => {
    const file = toXlsx(
      "Leads",
      ["Reference", "Name", "Amount (BDT)"],
      [
        ["FLT-261025-0001", "Rahim & Sons <Ltd>", 146480],
        ["VSA-261025-0002", '=HYPERLINK("x")', null],
        ["PKG-261025-0003", "সাকিব\u0007", 0],
      ],
    );
    const parts = unzip(file);
    expect([...parts.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    const sheet = parts.get("xl/worksheets/sheet1.xml") ?? "";
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toContain(
      '<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Reference</t></is></c>',
    );
    expect(sheet).toContain("Rahim &amp; Sons &lt;Ltd&gt;");
    expect(sheet).toContain('<c r="C2"><v>146480</v></c>');
    // A value that looks like a formula stays an inline string, never <f>.
    expect(sheet).toContain("=HYPERLINK(&quot;x&quot;)");
    expect(sheet).not.toContain("<f>");
    // Bangla stays, control characters go, an empty cell is left out.
    expect(sheet).toContain("সাকিব</t>");
    expect(sheet).not.toContain('r="C3"');
    expect(parts.get("xl/workbook.xml")).toContain('name="Leads"');
  });
});
