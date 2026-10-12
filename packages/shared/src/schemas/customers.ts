import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

/*
 * Customer accounts (PRD FR-ACC, issue 134): sign-in with Google for now; every flow still works as a guest. The web
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
