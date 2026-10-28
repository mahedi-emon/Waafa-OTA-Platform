import { Inject, Injectable } from "@nestjs/common";
import { toDhakaIsoString } from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";

export type CustomerNoteView = { id: string; body: string; actor: string; createdAt: string };

/** Tags are short words staff choose; stored trimmed, without repeats, in the order given. */
export function cleanTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const value = tag.trim().replace(/\s+/g, " ");
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/**
 * What staff add to a customer (issue 244): tags, notes, and merges of duplicate numbers. Customers stay keyed by phone
 * (D157); a merged number points at the customer it joined, and lists and the customer page fold it in. Merges are
 * reversible (Unmerge) and every change is audited.
 */
@Injectable()
export class CustomerProfilesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** alias phone → the customer it was merged into. */
  async aliases(): Promise<Map<string, string>> {
    const rows = await this.prisma.customerProfile.findMany({
      where: { mergedInto: { not: null } },
      select: { phone: true, mergedInto: true },
    });
    return new Map(rows.map((row) => [row.phone, row.mergedInto!]));
  }

  async tagsFor(phones: string[]): Promise<Map<string, string[]>> {
    if (phones.length === 0) return new Map();
    const rows = await this.prisma.customerProfile.findMany({
      where: { phone: { in: phones } },
      select: { phone: true, tags: true },
    });
    return new Map(rows.map((row) => [row.phone, row.tags]));
  }

  /** The customer page's extras: tags, notes, numbers merged into it, or where this number went. */
  async extras(phone: string) {
    const [profile, merged, notes] = await Promise.all([
      this.prisma.customerProfile.findUnique({ where: { phone } }),
      this.prisma.customerProfile.findMany({
        where: { mergedInto: phone },
        select: { phone: true },
      }),
      this.prisma.customerNote.findMany({
        where: { phone },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    return {
      mergedInto: profile?.mergedInto ?? null,
      tags: profile?.tags ?? [],
      mergedPhones: merged.map((row) => row.phone),
      notes: notes.map((note): CustomerNoteView => ({
        id: note.id,
        body: note.body,
        actor: note.actorName,
        createdAt: toDhakaIsoString(note.createdAt),
      })),
    };
  }

  async setTags(staff: StaffPrincipal, phone: string, tags: string[]) {
    const next = cleanTags(tags);
    const before = await this.prisma.customerProfile.findUnique({ where: { phone } });
    await this.prisma.$transaction(async (tx) => {
      await tx.customerProfile.upsert({
        where: { phone },
        update: { tags: next, updatedBy: staff.name },
        create: { phone, tags: next, updatedBy: staff.name },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.tags",
          entity: "customer",
          entityId: phone,
          before: { tags: before?.tags ?? [] },
          after: { tags: next },
        },
        tx,
      );
    });
    return next;
  }

  async addNote(staff: StaffPrincipal, phone: string, body: string) {
    await this.prisma.customerNote.create({
      data: { phone, body, actorId: staff.id, actorName: staff.name },
    });
  }

  /** Merges `phone` into `into`: its requests, orders, notes and tags show under `into` from now on. */
  async merge(staff: StaffPrincipal, phone: string, into: string) {
    if (phone === into) throw problems.conflict("A customer can't be merged into itself", "same");
    const [from, target] = await Promise.all([
      this.prisma.customerProfile.findUnique({ where: { phone } }),
      this.prisma.customerProfile.findUnique({ where: { phone: into } }),
    ]);
    if (from?.mergedInto) throw problems.conflict("This number is already merged", "merged");
    if (target?.mergedInto)
      throw problems.conflict(
        `Merge into ${target.mergedInto} instead; ${into} was merged there`,
        "chain",
      );
    const children = await this.prisma.customerProfile.count({ where: { mergedInto: phone } });
    if (children > 0)
      throw problems.conflict(
        "Other numbers are merged into this one; unmerge them first",
        "parent",
      );
    await this.prisma.$transaction(async (tx) => {
      const tags = [...(target?.tags ?? []), ...(from?.tags ?? [])];
      await tx.customerProfile.upsert({
        where: { phone: into },
        update: { tags: cleanTags(tags), updatedBy: staff.name },
        create: { phone: into, tags: cleanTags(tags), updatedBy: staff.name },
      });
      await tx.customerProfile.upsert({
        where: { phone },
        update: { mergedInto: into, updatedBy: staff.name },
        create: { phone, mergedInto: into, updatedBy: staff.name },
      });
      await tx.customerNote.updateMany({ where: { phone }, data: { phone: into } });
      await tx.customerNote.create({
        data: {
          phone: into,
          body: `Merged ${phone} into this customer`,
          actorId: staff.id,
          actorName: staff.name,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.merge",
          entity: "customer",
          entityId: phone,
          after: { into },
        },
        tx,
      );
    });
  }

  /** Undoes a merge: the number is a customer of its own again (its notes stay where they were moved). */
  async unmerge(staff: StaffPrincipal, phone: string) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { phone } });
    if (!profile?.mergedInto) throw problems.conflict("This number is not merged", "notMerged");
    await this.prisma.$transaction(async (tx) => {
      await tx.customerProfile.update({
        where: { phone },
        data: { mergedInto: null, updatedBy: staff.name },
      });
      await tx.customerNote.create({
        data: {
          phone: profile.mergedInto!,
          body: `Unmerged ${phone}`,
          actorId: staff.id,
          actorName: staff.name,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.unmerge",
          entity: "customer",
          entityId: phone,
          before: { into: profile.mergedInto },
        },
        tx,
      );
    });
  }
}
