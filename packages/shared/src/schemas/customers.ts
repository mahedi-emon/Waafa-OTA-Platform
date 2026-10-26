import { z } from "zod";
import { E164PhoneSchema, IsoDateTimeSchema } from "./common";

/*
 * Customer accounts (PRD FR-ACC, issues 134 and 241): sign-in with an email code or Google; every flow still works as a
 * guest. The web
 * server runs the OAuth redirect (state + PKCE) and hands the code to the API, which exchanges it with Google using
 * the secret kept in Admin › Integrations and answers with an opaque session token for an httpOnly cookie.
 */

/** RFC 7636: 43 to 128 characters from the unreserved set. */
export const PkceVerifierSchema = z
  .string()
  .regex(/^[A-Za-z0-9\-._~]{43,128}$/, "Invalid verifier");

export const GoogleSignInInputSchema = z
  .object({
    code: z.string().min(1).max(2048),
    codeVerifier: PkceVerifierSchema,
    /** Must be the site's own callback address (checked against the API's web origins). */
    redirectUri: z.url().max(300),
  })
  .strict();
export type GoogleSignInInput = z.infer<typeof GoogleSignInInputSchema>;

/** What the web needs to start the redirect: the public client ID only, never the secret. */
export const GoogleSignInConfigSchema = z
  .object({ enabled: z.boolean(), clientId: z.string().nullable() })
  .strict();
export type GoogleSignInConfig = z.infer<typeof GoogleSignInConfigSchema>;

export const CustomerViewSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    /** E.164, a contact field typed at sign-up (never verified, D301). */
    phone: z.string().nullable(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();
export type CustomerView = z.infer<typeof CustomerViewSchema>;

export const CustomerSessionSchema = z
  .object({
    token: z.string().min(32),
    expiresAt: IsoDateTimeSchema,
    customer: CustomerViewSchema,
  })
  .strict();
export type CustomerSession = z.infer<typeof CustomerSessionSchema>;

/** My account: the customer and the requests and orders sent with their verified email. */
export const AccountViewSchema = z
  .object({
    customer: CustomerViewSchema,
    requests: z.array(
      z
        .object({
          reference: z.string(),
          module: z.string(),
          status: z.string(),
          summary: z.string(),
          createdAt: IsoDateTimeSchema,
        })
        .strict(),
    ),
    orders: z.array(
      z
        .object({
          reference: z.string(),
          status: z.string(),
          total: z.number().int(),
          createdAt: IsoDateTimeSchema,
        })
        .strict(),
    ),
  })
  .strict();
export type AccountView = z.infer<typeof AccountViewSchema>;

/** Sessions last 30 days; signing in again starts a new one. */
export const CUSTOMER_SESSION_DAYS = 30;

/*
 * Email sign-in codes (issue 241, D301): no phone OTP and no SMS for sign-in. A 6-digit code goes by email, works for
 * 10 minutes, once, with at most 5 tries. An address without an account gets a 15-minute sign-up ticket after the
 * code, spent by the name-and-phone step. Every answer to a code request is the same, account or not.
 */
export const SIGN_IN_CODE_LENGTH = 6;
export const SIGN_IN_CODE_MINUTES = 10;
export const SIGN_IN_CODE_TRIES = 5;
export const SIGN_UP_TICKET_MINUTES = 15;

/** Trimmed and lower-cased before it is checked, so "Rahim@Example.com " and "rahim@example.com" are one account. */
export const CustomerEmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const EmailCodeRequestSchema = z.object({ email: CustomerEmailSchema }).strict();
export type EmailCodeRequest = z.infer<typeof EmailCodeRequestSchema>;

export const SignInCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const EmailCodeVerifySchema = z
  .object({ email: CustomerEmailSchema, code: SignInCodeSchema })
  .strict();
export type EmailCodeVerify = z.infer<typeof EmailCodeVerifySchema>;

/** An opaque sign-up ticket: base64url, never stored in clear. */
export const SignUpTicketSchema = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);

export const EmailCodeResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("signed-in"), session: CustomerSessionSchema }).strict(),
  z.object({ status: z.literal("new"), ticket: SignUpTicketSchema }).strict(),
]);
export type EmailCodeResult = z.infer<typeof EmailCodeResultSchema>;

export const SignUpCompleteSchema = z
  .object({
    ticket: SignUpTicketSchema,
    name: z.string().trim().min(2).max(80),
    phone: E164PhoneSchema,
  })
  .strict();
export type SignUpComplete = z.infer<typeof SignUpCompleteSchema>;

/** How a customer got in last time (admin Customers). */
export const SIGN_IN_METHODS = ["email-code", "google"] as const;
export type SignInMethod = (typeof SIGN_IN_METHODS)[number];
