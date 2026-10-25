import { describe, expect, it } from "vitest";
import { isStorageKey, sniffCustomerFile } from "./customerFiles";

describe("customer files (#232)", () => {
  it("knows a JPEG, PNG or PDF by its first bytes, never by its name", () => {
    expect(sniffCustomerFile(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0]))).toBe("image/jpeg");
    expect(
      sniffCustomerFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])),
    ).toBe("image/png");
    expect(sniffCustomerFile(new TextEncoder().encode("%PDF-1.4\n"))).toBe("application/pdf");
    expect(sniffCustomerFile(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffCustomerFile(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(sniffCustomerFile(new Uint8Array())).toBeNull();
  });

  it("accepts only storage keys the API hands out", () => {
    expect(isStorageKey(`cf_${"A1_-".repeat(8)}`)).toBe(true);
    expect(isStorageKey("cf_short")).toBe(false);
    expect(isStorageKey(`cf_${"a".repeat(31)}/`)).toBe(false);
    expect(isStorageKey(undefined)).toBe(false);
  });
});
