import { createHash, createHmac } from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
import { SecretBox } from "../providers/secretBox";

/** An S3-compatible bucket from the off-site storage card (Cloudflare R2 or Backblaze B2; issue 239). */
export type OffsiteTarget = {
  provider: "r2" | "b2";
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/**
 * The storage card that is On in Admin › Integrations (R2 first, then B2), with its secret opened; null when none is
 * On, its last test failed, or the secret cannot be opened. Server only.
 */
export async function activeOffsite(
  prisma: PrismaClient,
  providerSecretKey: string | undefined,
): Promise<OffsiteTarget | null> {
  if (!providerSecretKey) return null;
  const box = new SecretBox(providerSecretKey);
  for (const provider of ["r2", "b2"] as const) {
    const setting = await prisma.integrationSetting.findUnique({ where: { provider } });
    if (!setting?.isActive) continue;
    const row = await prisma.providerCredential.findUnique({
      where: { provider_environment: { provider, environment: "production" } },
    });
    if (!row || row.healthOk === false) continue;
    const settings = row.settings as Record<string, string>;
    const secrets = row.secrets as Record<string, string>;
    try {
      if (provider === "r2") {
        return {
          provider,
          endpoint: `https://${settings.accountId}.r2.cloudflarestorage.com`,
          region: "auto",
          bucket: settings.bucket ?? "",
          accessKeyId: settings.accessKeyId ?? "",
          secretAccessKey: box.open(secrets.secretAccessKey ?? ""),
        };
      }
      const endpoint = (settings.endpoint ?? "").replace(/\/+$/, "");
      return {
        provider,
        endpoint,
        region: /s3\.([a-z0-9-]+)\.backblazeb2\.com/.exec(endpoint)?.[1] ?? "us-east-1",
        bucket: settings.bucket ?? "",
        accessKeyId: settings.keyId ?? "",
        secretAccessKey: box.open(secrets.applicationKey ?? ""),
      };
    } catch {
      continue;
    }
  }
  return null;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value).digest();

/**
 * The headers for an S3 PUT signed with AWS Signature Version 4 (path-style URL, unsigned payload over HTTPS, as R2
 * and B2 accept). Pure, so the signature is tested against a fixed clock.
 */
export function signPut(
  target: OffsiteTarget,
  key: string,
  size: number,
  now = new Date(),
): { url: string; headers: Record<string, string> } {
  const url = new URL(
    `${target.endpoint}/${target.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`,
  );
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const day = stamp.slice(0, 8);
  const headers: Record<string, string> = {
    host: url.host,
    "content-length": String(size),
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
    "x-amz-date": stamp,
  };
  const names = Object.keys(headers).sort();
  const canonical = [
    "PUT",
    url.pathname,
    "",
    ...names.map((name) => `${name}:${headers[name]}`),
    "",
    names.join(";"),
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const scope = `${day}/${target.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", stamp, scope, sha256(canonical)].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${target.secretAccessKey}`, day), target.region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  return {
    url: url.toString(),
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${target.accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`,
    },
  };
}
