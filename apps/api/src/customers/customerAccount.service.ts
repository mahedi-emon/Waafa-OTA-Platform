import { Inject, Injectable } from "@nestjs/common";
import argon2 from "argon2";
import {
  toDhakaIsoString,
  type AccountPreferences,
  type AccountView,
  type AddressInput,
  type AddressView,
  type CustomerSession,
  type TravellerInput,
  type TravellerView,
  type WishlistItem,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { problems } from "../common/problem";
import { RateLimitService } from "../common/rateLimit.service";
import { visaTrack } from "../common/visaProgress";
import type { Customer, CustomerAddress, CustomerTraveller } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SecretBox } from "../providers/secretBox";
import { attachGuestRecords, openSession, sessionFor, view } from "./customerAuth";

/** How many requests and orders My account lists, newest first. */
const LIST_LIMIT = 50;
const MAX_TRAVELLERS = 12;
const MAX_ADDRESSES = 8;
const MAX_WISHLIST = 100;

/** A short device name from a user agent ("Chrome on Android"). */
export function deviceName(agent: string | null): string {
  if (!agent) return "Unknown device";
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Firefox\//.test(agent)
      ? "Firefox"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Browser";
  const system = /Android/.test(agent)
    ? "Android"
    : /iPhone|iPad/.test(agent)
      ? "iPhone or iPad"
      : /Windows/.test(agent)
        ? "Windows"
        : /Mac OS X/.test(agent)
          ? "Mac"
          : /Linux/.test(agent)
            ? "Linux"
            : "another system";
  return `${browser} on ${system}`;
}

/**
 * My account sections (FR-ACC, issue 278): requests and visa applications with their progress, orders, the wishlist,
 * saved travellers (passport number sealed at rest with AES-256-GCM, shown masked), addresses with a default for
 * checkout, offers preference, recent sign-ins with "Sign out other devices", and an optional password. Every call
 * needs a live session; a record belongs to the signed-in customer or it is "not found".
 */
@Injectable()
export class CustomerAccountService {
  private readonly passports: SecretBox;
  /** Checked when there is no password, so a missing account takes as long as a wrong password. */
  private readonly dummyHash = argon2.hash("waafa-no-password-here", { type: argon2.argon2id });

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
    @Inject(ENV) env: Env,
  ) {
    this.passports = new SecretBox(`waafa-customer-passport:${env.JWT_SECRET}`);
  }

  private async session(token: string | undefined) {
    const found = await sessionFor(this.prisma, token);
    if (!found) throw problems.unauthorized();
    return found;
  }

  private travellerView(row: CustomerTraveller): TravellerView {
    return {
      id: row.id,
      fullName: row.fullName,
      dateOfBirth: row.dateOfBirth,
      nationality: row.nationality,
      passportMasked: row.passportLast4 ? `•••• ${row.passportLast4}` : null,
      passportExpiry: row.passportExpiry,
    };
  }

  private addressView(row: CustomerAddress): AddressView {
    return {
      id: row.id,
      label: row.label,
      name: row.name,
      phone: row.phone,
      division: row.division,
      district: row.district,
      area: row.area,
      street: row.street,
      isDefault: row.isDefault,
    };
  }

  async view(token: string | undefined): Promise<AccountView> {
    const { customer, sessionId } = await this.session(token);
    // Requests sent since the last sign-in (as a guest, or with the same email) join the account here too.
    await attachGuestRecords(this.prisma, customer);
    const mine = { customerId: customer.id };
    const [leads, orders, wishlist, travellers, addresses, sessions] = await Promise.all([
      this.prisma.lead.findMany({
        where: { ...mine, status: { not: "spam" } },
        orderBy: { createdAt: "desc" },
        take: LIST_LIMIT,
        select: {
          reference: true,
          module: true,
          status: true,
          summary: true,
          payload: true,
          progress: true,
          createdAt: true,
          firstResponseAt: true,
          closedAt: true,
        },
      }),
      this.prisma.order.findMany({
        where: mine,
        orderBy: { createdAt: "desc" },
        take: LIST_LIMIT,
        select: { reference: true, status: true, total: true, createdAt: true, items: true },
      }),
      this.prisma.customerWishlistItem.findMany({ where: mine, orderBy: { createdAt: "desc" } }),
      this.prisma.customerTraveller.findMany({ where: mine, orderBy: { createdAt: "asc" } }),
      this.prisma.customerAddress.findMany({
        where: mine,
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
      this.prisma.customerSession.findMany({
        where: mine,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
    const requests = await Promise.all(
      leads.map(async (lead) => ({
        reference: lead.reference,
        module: lead.module as AccountView["requests"][number]["module"],
        status: lead.status as AccountView["requests"][number]["status"],
        summary: lead.summary,
        createdAt: toDhakaIsoString(lead.createdAt),
        respondedAt: lead.firstResponseAt ? toDhakaIsoString(lead.firstResponseAt) : null,
        closedAt: lead.closedAt ? toDhakaIsoString(lead.closedAt) : null,
        visa: lead.module === "visa" ? await visaTrack(this.prisma, lead) : null,
      })),
    );
    const now = Date.now();
    return {
      customer: view(customer),
      hasPassword: customer.passwordHash !== null,
      preferences: { notifyOffers: customer.notifyOffers },
      requests,
      orders: orders.map((order) => ({
        reference: order.reference,
        status: order.status,
        total: order.total,
        createdAt: toDhakaIsoString(order.createdAt),
        items: (
          order.items as Array<{
            productId: string;
            variantId: string;
            title: string;
            variantLabel?: string;
            sku: string;
            quantity: number;
          }>
        ).map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          title: item.title,
          ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
          sku: item.sku,
          quantity: item.quantity,
        })),
      })),
      wishlist: wishlist.map((item) => ({
        kind: item.kind as WishlistItem["kind"],
        slug: item.slug,
      })),
      travellers: travellers.map((row) => this.travellerView(row)),
      addresses: addresses.map((row) => this.addressView(row)),
      signIns: sessions.map((session) => ({
        id: session.id,
        device: deviceName(session.userAgent),
        at: toDhakaIsoString(session.createdAt),
        current: session.id === sessionId,
        active: !session.revokedAt && session.expiresAt.getTime() > now,
      })),
    };
  }

  // Wishlist -------------------------------------------------------------------------------------------------------

  async saveWish(token: string | undefined, item: WishlistItem): Promise<void> {
    const { customer } = await this.session(token);
    if (
      (await this.prisma.customerWishlistItem.count({ where: { customerId: customer.id } })) >=
      MAX_WISHLIST
    )
      throw problems.conflict("Your wishlist is full. Remove something first.", "full");
    await this.prisma.customerWishlistItem.upsert({
      where: {
        customerId_kind_slug: { customerId: customer.id, kind: item.kind, slug: item.slug },
      },
      create: { customerId: customer.id, kind: item.kind, slug: item.slug },
      update: {},
    });
  }

  async removeWish(token: string | undefined, item: WishlistItem): Promise<void> {
    const { customer } = await this.session(token);
    await this.prisma.customerWishlistItem.deleteMany({
      where: { customerId: customer.id, kind: item.kind, slug: item.slug },
    });
  }

  // Travellers -----------------------------------------------------------------------------------------------------

  private travellerData(input: TravellerInput) {
    return {
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth ?? null,
      nationality: input.nationality ?? null,
      passportSealed: input.passportNumber ? this.passports.seal(input.passportNumber) : null,
      passportLast4: input.passportNumber ? input.passportNumber.slice(-4) : null,
      passportExpiry: input.passportExpiry ?? null,
    };
  }

  async addTraveller(token: string | undefined, input: TravellerInput): Promise<TravellerView> {
    const { customer } = await this.session(token);
    if (
      (await this.prisma.customerTraveller.count({ where: { customerId: customer.id } })) >=
      MAX_TRAVELLERS
    )
      throw problems.conflict("You can keep up to 12 travellers.", "full");
    const row = await this.prisma.customerTraveller.create({
      data: { customerId: customer.id, ...this.travellerData(input) },
    });
    return this.travellerView(row);
  }

  async updateTraveller(
    token: string | undefined,
    id: string,
    input: TravellerInput,
  ): Promise<TravellerView> {
    const { customer } = await this.session(token);
    const existing = await this.prisma.customerTraveller.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) throw problems.notFound();
    const data = this.travellerData(input);
    // Leaving the passport box empty keeps the stored number.
    const row = await this.prisma.customerTraveller.update({
      where: { id },
      data: input.passportNumber
        ? data
        : {
            ...data,
            passportSealed: existing.passportSealed,
            passportLast4: existing.passportLast4,
          },
    });
    return this.travellerView(row);
  }

  async removeTraveller(token: string | undefined, id: string): Promise<void> {
    const { customer } = await this.session(token);
    const removed = await this.prisma.customerTraveller.deleteMany({
      where: { id, customerId: customer.id },
    });
    if (removed.count === 0) throw problems.notFound();
  }

  // Addresses ------------------------------------------------------------------------------------------------------

  async saveAddress(
    token: string | undefined,
    id: string | null,
    input: AddressInput,
  ): Promise<AddressView> {
    const { customer } = await this.session(token);
    const data = {
      label: input.label ?? null,
      name: input.name,
      phone: input.phone,
      division: input.division,
      district: input.district,
      area: input.area,
      street: input.street,
    };
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.customerAddress.count({ where: { customerId: customer.id } });
      if (id) {
        const existing = await tx.customerAddress.findFirst({
          where: { id, customerId: customer.id },
        });
        if (!existing) throw problems.notFound();
      } else if (count >= MAX_ADDRESSES) {
        throw problems.conflict("You can keep up to 8 addresses.", "full");
      }
      // The first address is the default; asking for a default moves it.
      const makeDefault = input.isDefault === true || (!id && count === 0);
      if (makeDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: customer.id },
          data: { isDefault: false },
        });
      }
      const row = id
        ? await tx.customerAddress.update({
            where: { id },
            data: { ...data, ...(makeDefault ? { isDefault: true } : {}) },
          })
        : await tx.customerAddress.create({
            data: { customerId: customer.id, ...data, isDefault: makeDefault },
          });
      return this.addressView(row);
    });
  }

  async removeAddress(token: string | undefined, id: string): Promise<void> {
    const { customer } = await this.session(token);
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.customerAddress.findFirst({
        where: { id, customerId: customer.id },
      });
      if (!existing) throw problems.notFound();
      await tx.customerAddress.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.customerAddress.findFirst({
          where: { customerId: customer.id },
          orderBy: { createdAt: "asc" },
        });
        if (next)
          await tx.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
  }

  // Preferences, sessions and password ----------------------------------------------------------------------------

  async setPreferences(token: string | undefined, input: AccountPreferences): Promise<void> {
    const { customer } = await this.session(token);
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { notifyOffers: input.notifyOffers },
    });
  }

  /** Ends every other session; this one stays. */
  async signOutOthers(token: string | undefined): Promise<number> {
    const { customer, sessionId } = await this.session(token);
    const ended = await this.prisma.customerSession.updateMany({
      where: { customerId: customer.id, revokedAt: null, id: { not: sessionId } },
      data: { revokedAt: new Date() },
    });
    return ended.count;
  }

  /** Sets or changes the optional password (the session proves who it is; a code sign-in resets a forgotten one). */
  async setPassword(token: string | undefined, password: string): Promise<void> {
    const { customer } = await this.session(token);
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
    });
  }

  async removePassword(token: string | undefined): Promise<void> {
    const { customer } = await this.session(token);
    await this.prisma.customer.update({ where: { id: customer.id }, data: { passwordHash: null } });
  }

  /**
   * Password sign-in for an account that set one. 5 tries per email in 15 minutes (the same count as a code), and the
   * same "wrong email or password" for an unknown address, a wrong password, an account without a password or a
   * turned-off account.
   */
  async signInWithPassword(
    email: string,
    password: string,
    userAgent: string | undefined,
  ): Promise<CustomerSession> {
    if (!(await this.limits.allow("customerPassword", email)))
      throw problems.tooMany("Too many tries. Sign in with an email code, or wait 15 minutes.");
    const customer: Customer | null = await this.prisma.customer.findUnique({ where: { email } });
    const hash = customer?.passwordHash && !customer.disabledAt ? customer.passwordHash : null;
    const matches = await argon2.verify(hash ?? (await this.dummyHash), password);
    const ok = hash !== null && matches;
    if (!customer || !ok) throw problems.unauthorized("Wrong email or password.");
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { lastSignInAt: new Date(), signInMethod: "password" },
    });
    await attachGuestRecords(this.prisma, updated);
    return openSession(this.prisma, updated, userAgent);
  }
}
