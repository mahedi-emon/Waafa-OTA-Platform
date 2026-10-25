import { describe, expect, it } from "vitest";
import { redactToken } from "../common/redact";
import { dispositionName } from "./customer-files.controller";

describe("customer file helpers (#232)", () => {
  it("keeps signed link tokens out of the request log", () => {
    expect(redactToken("/api/v1/public/files/signed?token=abc.123.def.ghi")).toBe(
      "/api/v1/public/files/signed?token=[redacted]",
    );
    expect(redactToken("/x?a=1&TOKEN=secret&b=2")).toBe("/x?a=1&TOKEN=[redacted]&b=2");
    expect(redactToken("/api/v1/public/snapshot")).toBe("/api/v1/public/snapshot");
  });

  it("names a download safely in the header", () => {
    expect(dispositionName('pass"port\r\n.jpg')).toBe(
      `inline; filename="pass_port__.jpg"; filename*=UTF-8''pass%22port%0D%0A.jpg`,
    );
    expect(dispositionName("পাসপোর্ট.pdf")).toContain("filename*=UTF-8''%E0%A6");
  });
});
