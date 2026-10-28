import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signPut, type OffsiteTarget } from "./offsiteStorage";

const target: OffsiteTarget = {
  provider: "r2",
  endpoint: "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com",
  region: "auto",
  bucket: "waafa-backups",
  accessKeyId: "AKIDEXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
};

describe("off-site backup upload (issue 239)", () => {
  it("signs a path-style PUT with SigV4 and an unsigned payload", () => {
    const now = new Date("2026-10-29T03:15:00Z");
    const { url, headers } = signPut(target, "backups/waafa-20261029-0315.sql.gz", 2048, now);
    expect(url).toBe(
      "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/waafa-backups/backups/waafa-20261029-0315.sql.gz",
    );
    expect(headers["x-amz-date"]).toBe("20261029T031500Z");
    expect(headers["content-length"]).toBe("2048");
    expect(headers.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20261029\/auto\/s3\/aws4_request, SignedHeaders=content-length;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );

    // The same signature computed independently from the SigV4 steps.
    const canonical = [
      "PUT",
      "/waafa-backups/backups/waafa-20261029-0315.sql.gz",
      "",
      "content-length:2048",
      `host:${new URL(target.endpoint).host}`,
      "x-amz-content-sha256:UNSIGNED-PAYLOAD",
      "x-amz-date:20261029T031500Z",
      "",
      "content-length;host;x-amz-content-sha256;x-amz-date",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const toSign = [
      "AWS4-HMAC-SHA256",
      "20261029T031500Z",
      "20261029/auto/s3/aws4_request",
      createHash("sha256").update(canonical).digest("hex"),
    ].join("\n");
    const key = ["20261029", "auto", "s3", "aws4_request"].reduce<Buffer | string>(
      (current, part) => createHmac("sha256", current).update(part).digest(),
      `AWS4${target.secretAccessKey}`,
    );
    const expected = createHmac("sha256", key).update(toSign).digest("hex");
    expect(headers.authorization?.endsWith(`Signature=${expected}`)).toBe(true);
  });
});
