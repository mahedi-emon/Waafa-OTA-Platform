import argon2 from "argon2";
import {
  CONTENT_KEYS,
  CONTENT_MODEL,
  contentRecordId,
  type CollectionKey,
  type ContentKey,
} from "@waafa/shared";
import type { Prisma, PrismaClient } from "../generated/prisma/client";

/** What the seed reads: every CONTENT_MODEL key with its parsed value (the A4 fixtures in practice). */
export type SeedContent = { [K in ContentKey]?: unknown };

export type SeedOptions = {
  /** First Super Admin, created only when the staff table is empty. Never a default password. */
  admin?: { email: string; password: string; name?: string };
};

export type SeedResult = { settings: number; documents: number; adminCreated: boolean };

const json = (value: unknown) => value as Prisma.InputJsonValue;

/**
 * Loads content and settings without overwriting admin edits: a setting or a record that already exists is left as
 * it is, so the seed can run on every deploy. Every value is validated with its CONTENT_MODEL schema first.
 */
export async function seedDatabase(
  prisma: PrismaClient,
  content: SeedContent,
  options: SeedOptions = {},
): Promise<SeedResult> {
  let settings = 0;
  let documents = 0;

  for (const key of CONTENT_KEYS) {
    const value = content[key];
    if (value === undefined) continue;
    const entry = CONTENT_MODEL[key];
    if (entry.kind === "singleton") {
      const parsed = entry.schema.parse(value);
      const existing = await prisma.setting.findUnique({ where: { key } });
      if (!existing) {
        await prisma.setting.create({ data: { key, value: json(parsed), updatedBy: "seed" } });
        settings += 1;
      }
      continue;
    }
    if (!Array.isArray(value)) throw new Error(`Seed value for "${key}" must be an array`);
    const rows = value.map((record, position) => {
      const parsed = entry.schema.parse(record);
      return {
        collection: key,
        docId: contentRecordId(key as CollectionKey, parsed),
        data: json(parsed),
        position,
        updatedBy: "seed",
      };
    });
    if (rows.length === 0) continue;
    const created = await prisma.contentDocument.createMany({ data: rows, skipDuplicates: true });
    documents += created.count;
  }

  let adminCreated = false;
  if (options.admin && (await prisma.staffUser.count()) === 0) {
    if (options.admin.password.length < 12) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
    }
    await prisma.staffUser.create({
      data: {
        name: options.admin.name ?? "Super Admin",
        email: options.admin.email.trim().toLowerCase(),
        passwordHash: await argon2.hash(options.admin.password, { type: argon2.argon2id }),
        roles: ["super-admin"],
      },
    });
    adminCreated = true;
  }

  return { settings, documents, adminCreated };
}
