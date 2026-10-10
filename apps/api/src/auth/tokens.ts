import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { RoleSchema, type Role } from "@waafa/shared";
import { z } from "zod";

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const ISSUER = "waafa-api";
const AUDIENCE = "waafa-admin";

const ClaimsSchema = z.object({
  sub: z.string().min(1),
  sid: z.string().min(1),
  name: z.string(),
  email: z.string(),
  roles: z.array(RoleSchema),
});

export type AccessClaims = z.infer<typeof ClaimsSchema>;

const key = (secret: string) => new TextEncoder().encode(secret);

/** 15-minute access token (HS256) carrying the staff id, session, name and roles. */
export async function signAccessToken(
  claims: AccessClaims,
  secret: string,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const token = await new SignJWT({
    sid: claims.sid,
    name: claims.name,
    email: claims.email,
    roles: claims.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ACCESS_TTL_SECONDS)
    .sign(key(secret));
  return { token, expiresAt: new Date((issuedAt + ACCESS_TTL_SECONDS) * 1000) };
}

/** Verifies an access token; null when it is invalid, expired or for another audience. */
export async function verifyAccessToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      currentDate: now,
      algorithms: ["HS256"],
    });
    const parsed = ClaimsSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** A refresh token (256 random bits) and the hash that is stored instead of it. */
export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function asRoles(values: string[]): Role[] {
  return values.filter((value): value is Role => RoleSchema.safeParse(value).success);
}
