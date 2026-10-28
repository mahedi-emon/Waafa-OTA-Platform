import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  formatDate,
  formatTaka,
  isQuoteExpired,
  publicQuoteState,
  quoteOptionsOf,
  toDhakaDateString,
  toDhakaIsoString,
  whatsappLink,
  type LeadModule,
  type PublicQuote,
  type QuoteChannel,
  type QuoteInput,
  type QuoteStatus,
  type QuoteView,
  type StaffAlertArea,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { ProblemException, problems } from "../common/problem";
import { nextReference } from "../common/references";
import { ENV, type Env } from "../config/env";
import { ContentService } from "../content/content.service";
import type { Prisma, Quote } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { quoteIdOf, quoteToken } from "../quotes/quoteLink";
import { dateOf, optionsOf } from "../quotes/quoteSummary";
import { renderQuotePdf } from "../quotes/quotePdf";
import { assertLeadAccess } from "./access";
import { AdminLeadsService } from "./leads.service";

type LeadFacts = {
  id: string;
  reference: string;
  module: string;
  status: string;
  summary: string;
  name: string;
  phone: string;
  email: string | null;
};
type QuoteRow = Quote & { lead: LeadFacts };

const LEAD_FACTS = {
  id: true,
  reference: true,
  module: true,
  status: true,
  summary: true,
  name: true,
  phone: true,
  email: true,
} as const;

const CLOSED_LEADS = new Set(["booked", "lost", "cancelled", "spam"]);

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const validWords = (validUntil: string) => formatDate(`${validUntil}T12:00:00+06:00`);

const VALIDATION = (path: string, message: string) =>
  new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "Validation failed", message, [
    { path, message },
  ]);

/**
 * Quotes (issue 298, PRD §6 leads P1): staff write fare or package options with baggage and a price and the last
 * valid day, then send the customer a signed link by email or WhatsApp (the lead moves to Quoted and the timeline
 * says how it went). The customer sees the options and the PDF and accepts one; staff are alerted and convert the
 * lead to a booking. Every step is audited.
 */
@Injectable()
export class AdminQuotesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AdminLeadsService) private readonly leads: AdminLeadsService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private link(id: string): string {
    return `${this.env.WEB_ORIGINS[0] ?? ""}/quote/${quoteToken(id, this.env.JWT_SECRET)}`;
  }

  private view(row: QuoteRow, now: Date): QuoteView {
    const validUntil = dateOf(row.validUntil);
    const link = this.link(row.id);
    const message = `Hello ${firstName(row.lead.name)}, here is your quote ${row.reference} from Waafa Tours and Travel, valid until ${validWords(validUntil)}: ${link}\nPrices are indicative until our travel expert confirms them before payment.`;
    return {
      id: row.id,
      reference: row.reference,
      leadId: row.lead.id,
      leadReference: row.lead.reference,
      leadStatus: row.lead.status,
      leadSummary: row.lead.summary,
      customerName: row.lead.name,
      customerPhone: row.lead.phone,
      customerEmail: row.lead.email,
      status: row.status as QuoteStatus,
      expired: isQuoteExpired(row.status as QuoteStatus, validUntil, toDhakaDateString(now)),
      options: optionsOf(row),
      validUntil,
      notes: row.notes,
      acceptedOptionId: row.acceptedOption,
      acceptedAt: row.acceptedAt ? toDhakaIsoString(row.acceptedAt) : null,
      sentAt: row.sentAt ? toDhakaIsoString(row.sentAt) : null,
      sentVia: row.sentVia as QuoteChannel[],
      link,
      whatsapp: row.lead.phone ? whatsappLink(row.lead.phone, message) : null,
      createdAt: toDhakaIsoString(row.createdAt),
      updatedAt: toDhakaIsoString(row.updatedAt),
      updatedBy: row.updatedBy,
    };
  }

  private assertValidDay(validUntil: string, now: Date): void {
    if (validUntil < toDhakaDateString(now))
      throw VALIDATION("validUntil", "Pick today or a later day");
  }

  private async load(staff: StaffPrincipal, id: string): Promise<QuoteRow> {
    const row = await this.prisma.quote.findUnique({
      where: { id },
      include: { lead: { select: LEAD_FACTS } },
    });
    if (!row) throw problems.notFound("Quote not found");
    assertLeadAccess(staff, row.lead.module);
    return row;
  }

  async create(
    staff: StaffPrincipal,
    leadId: string,
    input: QuoteInput,
    now = new Date(),
  ): Promise<QuoteView> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId }, select: LEAD_FACTS });
    if (!lead) throw problems.notFound("Lead not found");
    assertLeadAccess(staff, lead.module);
    if (CLOSED_LEADS.has(lead.status))
      throw problems.conflict("This lead is closed: reopen it to quote again", "closed");
    this.assertValidDay(input.validUntil, now);
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.quote.create({
        data: {
          reference: await nextReference(tx, "QTN", now),
          leadId,
          options: quoteOptionsOf(input.options) as unknown as Prisma.InputJsonValue,
          validUntil: new Date(`${input.validUntil}T00:00:00Z`),
          notes: input.notes || null,
          createdBy: staff.name,
          updatedBy: staff.name,
          createdAt: now,
        },
        include: { lead: { select: LEAD_FACTS } },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "quote.create",
          entity: "quote",
          entityId: created.reference,
          after: { lead: lead.reference, ...input },
        },
        tx,
      );
      return created;
    });
    return this.view(row, now);
  }

  async get(staff: StaffPrincipal, id: string, now = new Date()): Promise<QuoteView> {
    return this.view(await this.load(staff, id), now);
  }

  async update(
    staff: StaffPrincipal,
    id: string,
    input: QuoteInput,
    now = new Date(),
  ): Promise<QuoteView> {
    const before = await this.load(staff, id);
    if (before.status === "accepted")
      throw problems.conflict("The customer accepted this quote: write a new one", "accepted");
    if (before.status === "withdrawn")
      throw problems.conflict("This quote was withdrawn: write a new one", "withdrawn");
    this.assertValidDay(input.validUntil, now);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: { id },
        data: {
          options: quoteOptionsOf(input.options) as unknown as Prisma.InputJsonValue,
          validUntil: new Date(`${input.validUntil}T00:00:00Z`),
          notes: input.notes || null,
          updatedBy: staff.name,
        },
        include: { lead: { select: LEAD_FACTS } },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "quote.update",
          entity: "quote",
          entityId: before.reference,
          before: {
            options: before.options,
            validUntil: dateOf(before.validUntil),
            notes: before.notes,
          },
          after: input,
        },
        tx,
      );
      return updated;
    });
    return this.view(row, now);
  }

  /**
   * Sends the quote: by email from the "quote-customer" template, or records that staff opened WhatsApp with the link.
   * The lead takes the "Log quote" step (moves to Quoted, timeline and audit), so the same rules refuse closed leads.
   */
  async send(
    staff: StaffPrincipal,
    id: string,
    channel: QuoteChannel,
    now = new Date(),
  ): Promise<QuoteView> {
    const quote = await this.load(staff, id);
    if (quote.status === "accepted" || quote.status === "withdrawn")
      throw problems.conflict(
        quote.status === "accepted"
          ? "The customer already accepted this quote"
          : "This quote was withdrawn: write a new one",
        quote.status,
      );
    const validUntil = dateOf(quote.validUntil);
    if (isQuoteExpired(quote.status as QuoteStatus, validUntil, toDhakaDateString(now)))
      throw problems.conflict("This quote has expired: change the last valid day first", "expired");
    if (channel === "email" && !quote.lead.email)
      throw VALIDATION("channel", "This request has no email: send the link on WhatsApp");
    const options = optionsOf(quote);
    await this.leads.act(
      staff,
      quote.lead.id,
      {
        type: "quote",
        amount: Math.min(...options.map((option) => option.price)),
        note: `${quote.reference} sent ${channel === "email" ? "by email" : "on WhatsApp"}`,
      },
      now,
    );
    const row = await this.prisma.quote.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: now,
        sentVia: [...new Set([...quote.sentVia, channel])],
        updatedBy: staff.name,
      },
      include: { lead: { select: LEAD_FACTS } },
    });
    await this.audit.record({
      actor: staff,
      action: "quote.send",
      entity: "quote",
      entityId: quote.reference,
      after: { channel },
    });
    if (channel === "email") {
      void this.notifications.notify("quote-customer", quote.lead.email ?? undefined, {
        name: firstName(quote.lead.name),
        reference: quote.reference,
        summary: quote.lead.summary,
        options: options.length === 1 ? "one option" : `${options.length} options`,
        valid_until: validWords(validUntil),
        link: this.link(quote.id),
      });
    }
    return this.view(row, now);
  }

  async withdraw(staff: StaffPrincipal, id: string, now = new Date()): Promise<QuoteView> {
    const quote = await this.load(staff, id);
    if (quote.status === "accepted")
      throw problems.conflict(
        "The customer accepted this quote: it can't be withdrawn",
        "accepted",
      );
    if (quote.status === "withdrawn") return this.view(quote, now);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: { id },
        data: { status: "withdrawn", updatedBy: staff.name },
        include: { lead: { select: LEAD_FACTS } },
      });
      await tx.leadActivity.create({
        data: {
          leadId: quote.lead.id,
          type: "quote",
          body: `Withdrew quote ${quote.reference}: its link no longer opens the options`,
          actorId: staff.id,
          actorName: staff.name,
          createdAt: now,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "quote.withdraw",
          entity: "quote",
          entityId: quote.reference,
          before: { status: quote.status },
          after: { status: "withdrawn" },
        },
        tx,
      );
      return updated;
    });
    return this.view(row, now);
  }

  async pdfForStaff(staff: StaffPrincipal, id: string): Promise<{ name: string; pdf: Buffer }> {
    const row = await this.load(staff, id);
    return { name: `${row.reference}.pdf`, pdf: await this.pdf(row) };
  }

  private async pdf(row: QuoteRow): Promise<Buffer> {
    const contact = await this.content.setting("contactSettings");
    const origin = this.env.WEB_ORIGINS[0] ?? "https://waafasworld.com";
    return renderQuotePdf({
      reference: row.reference,
      issuedAt: row.sentAt ?? row.createdAt,
      customerName: row.lead.name,
      summary: row.lead.summary,
      validUntil: dateOf(row.validUntil),
      options: optionsOf(row),
      notes: row.notes,
      acceptedOptionId: row.acceptedOption,
      contact: {
        phone: contact.phoneDisplay,
        email: contact.email,
        website: new URL(origin).host,
      },
    });
  }

  // The customer's side: by the signed link only, and never a draft.

  private async byToken(token: string): Promise<QuoteRow> {
    const id = quoteIdOf(token, this.env.JWT_SECRET);
    const row = id
      ? await this.prisma.quote.findUnique({
          where: { id },
          include: { lead: { select: LEAD_FACTS } },
        })
      : null;
    if (!row || row.status === "draft") throw problems.notFound("This quote link is not valid");
    return row;
  }

  private publicView(row: QuoteRow, now: Date): PublicQuote {
    const validUntil = dateOf(row.validUntil);
    return {
      reference: row.reference,
      firstName: firstName(row.lead.name),
      summary: row.lead.summary,
      state: publicQuoteState(row.status as QuoteStatus, validUntil, toDhakaDateString(now)),
      options: optionsOf(row),
      validUntil,
      notes: row.notes,
      acceptedOptionId: row.acceptedOption,
      acceptedAt: row.acceptedAt ? toDhakaIsoString(row.acceptedAt) : null,
    };
  }

  async forCustomer(token: string, now = new Date()): Promise<PublicQuote> {
    return this.publicView(await this.byToken(token), now);
  }

  async pdfForCustomer(token: string): Promise<{ name: string; pdf: Buffer }> {
    const row = await this.byToken(token);
    return { name: `${row.reference}.pdf`, pdf: await this.pdf(row) };
  }

  /**
   * The customer accepts one option: the quote is Accepted, the lead's other open quotes are withdrawn, the timeline
   * says which option, and the people who get alerts for the lead's service are emailed. Accepting the same option
   * again answers the same; another option, an expired or a withdrawn quote is refused.
   */
  async accept(token: string, optionId: string, now = new Date()): Promise<PublicQuote> {
    const row = await this.byToken(token);
    const options = optionsOf(row);
    const option = options.find((item) => item.id === optionId);
    if (!option) throw VALIDATION("optionId", "Pick one of the options");
    if (row.status === "accepted") {
      if (row.acceptedOption === optionId) return this.publicView(row, now);
      throw problems.conflict("You already accepted another option on this quote", "accepted");
    }
    if (row.status === "withdrawn")
      throw problems.conflict("This quote was withdrawn: ask us for a new one", "withdrawn");
    if (isQuoteExpired(row.status as QuoteStatus, dateOf(row.validUntil), toDhakaDateString(now)))
      throw new ProblemException(
        HttpStatus.GONE,
        "Expired",
        "This quote has expired: ask us for a new one",
        undefined,
        "expired",
      );
    const updated = await this.prisma.$transaction(async (tx) => {
      // Only a quote still open moves: two taps at once accept it once.
      const moved = await tx.quote.updateMany({
        where: { id: row.id, status: "sent" },
        data: { status: "accepted", acceptedOption: optionId, acceptedAt: now },
      });
      if (moved.count === 0) return null;
      await tx.quote.updateMany({
        where: { leadId: row.lead.id, id: { not: row.id }, status: { in: ["draft", "sent"] } },
        data: { status: "withdrawn", updatedBy: "Customer accepted another quote" },
      });
      await tx.leadActivity.create({
        data: {
          leadId: row.lead.id,
          type: "quote",
          body: `The customer accepted "${option.title}" (${formatTaka(option.price)}) on ${row.reference}`,
          actorName: "Customer",
          createdAt: now,
        },
      });
      await this.audit.record(
        {
          actor: { id: null, name: "Customer" },
          action: "quote.accept",
          entity: "quote",
          entityId: row.reference,
          before: { status: row.status },
          after: { status: "accepted", option: optionId, price: option.price },
        },
        tx,
      );
      return tx.quote.findUniqueOrThrow({
        where: { id: row.id },
        include: { lead: { select: LEAD_FACTS } },
      });
    });
    if (!updated) return this.forCustomer(token, now);
    void this.notifications.notifyStaff(
      "quote-accepted-staff",
      row.lead.module as LeadModule as StaffAlertArea,
      {
        name: row.lead.name,
        reference: row.reference,
        option: option.title,
        price: formatTaka(option.price),
        lead_reference: row.lead.reference,
        link: this.notifications.adminLink(`/leads/${row.lead.id}`),
      },
    );
    return this.publicView(updated, now);
  }
}
