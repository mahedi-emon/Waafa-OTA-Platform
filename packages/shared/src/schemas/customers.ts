import { z } from "zod";
import { E164PhoneSchema, IsoDateSchema, IsoDateTimeSchema } from "./common";
import { LeadModuleSchema, LeadStatusSchema } from "./leads";
import { TrackedRequestSchema } from "./track";

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

/*
 * My account sections (issue 278): the requests and visa applications with their progress, orders, the wishlist,
 * saved travellers (passport number sealed at rest, shown masked), addresses, preferences and recent sign-ins.
 */

export const WISHLIST_KINDS = ["package", "product"] as const;
export const WishlistItemSchema = z
  .object({ kind: z.enum(WISHLIST_KINDS), slug: z.string().regex(/^[a-z0-9-]{1,120}$/) })
  .strict();
export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export const TravellerInputSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    dateOfBirth: IsoDateSchema.optional(),
    nationality: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    /** Letters and digits as printed (6 to 12), stored sealed. */
    passportNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{6,12}$/, "Enter the passport number as printed")
      .optional(),
    passportExpiry: IsoDateSchema.optional(),
  })
  .strict();
export type TravellerInput = z.infer<typeof TravellerInputSchema>;

export const TravellerViewSchema = z
  .object({
    id: z.string(),
    fullName: z.string(),
    dateOfBirth: z.string().nullable(),
    nationality: z.string().nullable(),
    /** "•••• 4821", never the whole number. */
    passportMasked: z.string().nullable(),
    passportExpiry: z.string().nullable(),
  })
  .strict();
export type TravellerView = z.infer<typeof TravellerViewSchema>;

export const AddressInputSchema = z
  .object({
    label: z.string().trim().max(40).optional(),
    name: z.string().trim().min(2).max(80),
    phone: E164PhoneSchema,
    division: z.string().trim().min(2).max(40),
    district: z.string().trim().min(2).max(60),
    area: z.string().trim().min(2).max(80),
    street: z.string().trim().min(3).max(200),
    isDefault: z.boolean().optional(),
  })
  .strict();
export type AddressInput = z.infer<typeof AddressInputSchema>;

export const AddressViewSchema = AddressInputSchema.omit({ isDefault: true, label: true })
  .extend({ id: z.string(), label: z.string().nullable(), isDefault: z.boolean() })
  .strict();
export type AddressView = z.infer<typeof AddressViewSchema>;

export const AccountPreferencesSchema = z.object({ notifyOffers: z.boolean() }).strict();
export type AccountPreferences = z.infer<typeof AccountPreferencesSchema>;

export const SignInEntrySchema = z
  .object({
    id: z.string(),
    device: z.string(),
    at: IsoDateTimeSchema,
    current: z.boolean(),
    active: z.boolean(),
  })
  .strict();
export type SignInEntry = z.infer<typeof SignInEntrySchema>;

export const PASSWORD_MIN = 10;
export const PasswordSetSchema = z
  .object({ password: z.string().min(PASSWORD_MIN).max(128) })
  .strict();

const AccountRequestSchema = TrackedRequestSchema.omit({ kind: true }).extend({
  summary: z.string(),
  module: LeadModuleSchema,
  status: LeadStatusSchema,
});

/** My account: the customer, their records on the account, and the sections they keep. */
export const AccountViewSchema = z
  .object({
    customer: CustomerViewSchema,
    hasPassword: z.boolean(),
    preferences: AccountPreferencesSchema,
    requests: z.array(AccountRequestSchema),
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
    wishlist: z.array(WishlistItemSchema),
    travellers: z.array(TravellerViewSchema),
    addresses: z.array(AddressViewSchema),
    signIns: z.array(SignInEntrySchema),
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
export const SIGN_IN_METHODS = ["email-code", "google", "password"] as const;
export type SignInMethod = (typeof SIGN_IN_METHODS)[number];

/** Password sign-in for an account that set one (issue 278); the email code always works too. */
export const PasswordSignInSchema = z
  .object({ email: CustomerEmailSchema, password: z.string().min(1).max(128) })
  .strict();
