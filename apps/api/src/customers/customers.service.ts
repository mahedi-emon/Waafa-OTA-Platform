import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  type CustomerSession,
  type GoogleSignInConfig,
  type GoogleSignInInput,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { problems } from "../common/problem";
import type { Customer } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ProvidersService } from "../providers/providers.service";
import { attachGuestRecords, hashToken, openSession, sessionFor } from "./customerAuth";
import { GoogleSignInError, exchangeGoogleCode, type GoogleFetch } from "./googleOAuth";

export const GOOGLE_FETCH = Symbol("GOOGLE_FETCH");

/** The only callback path the web serves; any other redirect address is refused. */
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

/**
 * Customer accounts (FR-ACC, issue 134): Google sign-in with the credentials from Admin › Integrations, opaque
 * 30-day sessions (only their hash is stored), My account with the requests and orders sent with the verified email,
 * sign-out and account deletion. Requests and orders stay guest records and are never deleted with the account.
 */
@Injectable()
export class CustomersService {
  private readonly logger = new Logger("Customers");

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProvidersService) private readonly providers: ProvidersService,
    @Inject(GOOGLE_FETCH) private readonly fetcher: GoogleFetch,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Admin › Integrations › Sign-in wins. Without a saved Google record, the server's GOOGLE_CLIENT_ID and
   * GOOGLE_CLIENT_SECRET are used, so a fresh production server signs in from the first start (#149). A record that
   * is turned off stays off: the environment never overrides an admin's choice.
   */
  private async googleCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
    const config = await this.providers.getIntegrationConfig("auth", "google");
    if (config.status === "ready") {
      const clientId = config.settings.clientId?.trim();
      const clientSecret = config.secrets.clientSecret?.trim();
      return clientId && clientSecret ? { clientId, clientSecret } : null;
    }
    const clientId = this.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = this.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) return null;
    const saved = await this.prisma.integrationSetting.findUnique({
      where: { provider: "google" },
    });
    return saved ? null : { clientId, clientSecret };
  }

  /** Whether the Google button shows, and the public client ID it redirects with. */
  async googleConfig(): Promise<GoogleSignInConfig> {
    const credentials = await this.googleCredentials();
    return credentials
      ? { enabled: true, clientId: credentials.clientId }
      : { enabled: false, clientId: null };
  }

  async signInWithGoogle(input: GoogleSignInInput, userAgent?: string): Promise<CustomerSession> {
    const redirect = new URL(input.redirectUri);
    if (
      !this.env.WEB_ORIGINS.includes(redirect.origin) ||
      redirect.pathname !== GOOGLE_CALLBACK_PATH
    ) {
      throw problems.badRequest("The redirect address is not this site's", "redirect-uri");
    }
    const credentials = await this.googleCredentials();
    if (!credentials) throw problems.notFound("Google sign-in is turned off");

    let identity;
    try {
      identity = await exchangeGoogleCode(this.fetcher, {
        ...credentials,
        code: input.code,
        codeVerifier: input.codeVerifier,
        redirectUri: input.redirectUri,
      });
    } catch (error) {
      if (error instanceof GoogleSignInError) {
        this.logger.warn(`Google sign-in refused: ${error.reason}`);
        throw problems.unauthorized("Google sign-in did not complete; try again");
      }
      throw error;
    }

    const now = new Date();
    // The Google account first; else the same verified email (links an account made before); else a new one.
    const existing =
      (await this.prisma.customer.findUnique({ where: { googleSub: identity.sub } })) ??
      (await this.prisma.customer.findUnique({ where: { email: identity.email } }));
    // A changed Google email follows the account unless another account already holds that address.
    const emailTaken =
      existing && existing.email !== identity.email
        ? (await this.prisma.customer.count({ where: { email: identity.email } })) > 0
        : false;
    // A disabled account is refused like a failed sign-in (#241).
    if (existing?.disabledAt)
      throw problems.unauthorized("Google sign-in did not complete; try again");
    const customer = existing
      ? await this.prisma.customer.update({
          where: { id: existing.id },
          data: {
            googleSub: identity.sub,
            email: emailTaken ? existing.email : identity.email,
            name: identity.name,
            lastSignInAt: now,
            signInMethod: "google",
            ...(existing.emailVerifiedAt ? {} : { emailVerifiedAt: now }),
          },
        })
      : await this.prisma.customer.create({
          data: {
            googleSub: identity.sub,
            email: identity.email,
            name: identity.name,
            lastSignInAt: now,
            signInMethod: "google",
            emailVerifiedAt: now,
          },
        });
    await attachGuestRecords(this.prisma, customer);
    return openSession(this.prisma, customer, userAgent, now);
  }

  /** The signed-in customer for a session token, or a 401. */
  private async customerFor(token: string | undefined): Promise<Customer> {
    const found = await sessionFor(this.prisma, token);
    if (!found) throw problems.unauthorized();
    return found.customer;
  }

  /** Ends this session only; an unknown token is already signed out. */
  async signOut(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.customerSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Deletes the account and every session; requests and orders stay with the business, no longer linked. */
  async deleteAccount(token: string | undefined): Promise<void> {
    const customer = await this.customerFor(token);
    await this.prisma.customer.delete({ where: { id: customer.id } });
  }
}
