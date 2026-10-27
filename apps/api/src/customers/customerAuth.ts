import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import {
  CUSTOMER_SESSION_DAYS,
  SIGN_IN_CODE_LENGTH,
  type CustomerSession,
  type CustomerView,
} from "@waafa/shared";
import type { Customer, Prisma, PrismaClient } from "../generated/prisma/client";

/*
 * Pieces shared by Google and email-code sign-in (issues 134 and 241): sessions, codes and guest-record attachment.
 */

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function view(customer: Customer): CustomerView {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    createdAt: customer.createdAt.toISOString(),
  };
}

/** A uniformly random 6-digit code, leading zeros kept. */
export function newSignInCode(): string {
  return String(randomInt(0, 10 ** SIGN_IN_CODE_LENGTH)).padStart(SIGN_IN_CODE_LENGTH, "0");
}

/**
 * The stored form of a code: an HMAC keyed by the server secret, bound to the address. A copied table cannot be
 * searched for the million possible codes without the key.
 */
export function codeHash(secret: string, email: string, code: string): string {
  return createHmac("sha256", `waafa-customer-code:${secret}`)
    .update(`${email}\n${code}`)
    .digest("hex");
}

/** Constant-time comparison of two hex digests. */
export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/** An opaque token for a cookie or a sign-up ticket. */
export const newToken = () => randomBytes(32).toString("base64url");

type Db = PrismaClient | Prisma.TransactionClient;

/** Opens a 30-day session; only the token's hash is stored. */
export async function openSession(
  db: Db,
  customer: Customer,
  userAgent: string | undefined,
  now = new Date(),
): Promise<CustomerSession> {
  const token = newToken();
  const expiresAt = new Date(now.getTime() + CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.customerSession.create({
    data: {
      customerId: customer.id,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: userAgent?.slice(0, 200) ?? null,
    },
  });
  return { token, expiresAt: expiresAt.toISOString(), customer: view(customer) };
}

/**
 * Guest requests and orders that belong to a verified account (D301): the same email, or the account's phone when the
 * record has no email at all. A record with another email is never taken by phone. Records already on an account
 * (including one staff attached by hand) stay where they are.
 */
export function attachableBy(customer: Pick<Customer, "email" | "phone">) {
  const noEmail = { OR: [{ email: null }, { email: "" }] };
  return {
    customerId: null,
    OR: [
      { email: { equals: customer.email, mode: "insensitive" as const } },
      ...(customer.phone ? [{ AND: [noEmail, { phone: customer.phone }] }] : []),
    ],
  };
}

/** Attaches the guest records that belong to a verified account; returns how many were attached. */
export async function attachGuestRecords(db: Db, customer: Customer): Promise<number> {
  if (!customer.emailVerifiedAt || customer.disabledAt) return 0;
  const where = attachableBy(customer);
  const [leads, orders] = await Promise.all([
    db.lead.updateMany({ where, data: { customerId: customer.id } }),
    db.order.updateMany({ where, data: { customerId: customer.id } }),
  ]);
  return leads.count + orders.count;
}

/** The signed-in customer and their session for a cookie token, or null (missing, ended, expired or turned off). */
export async function sessionFor(
  db: Db,
  token: string | undefined,
): Promise<{ customer: Customer; sessionId: string } | null> {
  if (!token || token.length < 32 || token.length > 128) return null;
  const session = await db.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    session.customer.disabledAt
  ) {
    return null;
  }
  return { customer: session.customer, sessionId: session.id };
}
