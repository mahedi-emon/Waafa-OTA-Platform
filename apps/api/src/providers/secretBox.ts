import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";

/**
 * AES-256-GCM for external API secrets at rest (PRD §13, #82). The key is the SHA-256 of PROVIDER_SECRET_KEY, so any
 * long random string works. Sealed values look like "v1.<iv>.<tag>.<ciphertext>" (base64url); a changed or foreign
 * value fails to open instead of returning garbage.
 */
export class SecretBox {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (secret.length < 32)
      throw new Error("The provider secret key must be at least 32 characters");
    this.key = createHash("sha256").update(secret, "utf8").digest();
  }

  seal(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv, tag, body]
      .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
      .join(".");
  }

  open(sealed: string): string {
    const [version, iv, tag, body] = sealed.split(".");
    if (version !== VERSION || !iv || !tag || body === undefined)
      throw new Error("Not a sealed secret");
    // A fixed 16-byte tag: a truncated tag is refused instead of weakening the check.
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(iv, "base64url"), {
      authTagLength: 16,
    });
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(body, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}

/** "saved, ends in 1234" for the admin; short secrets show nothing. */
export function lastFour(plain: string): string | null {
  return plain.length >= 12 ? plain.slice(-4) : null;
}
