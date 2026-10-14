import type { Prisma, PrismaClient } from "../generated/prisma/client";

/** The patches already applied to this database; each runs once, on the first deploy that carries it. */
export const PATCH_MARKER = "_seedPatches";

/** Settings the seed keeps for itself; patches never touch them. */
const INTERNAL_KEYS = new Set([PATCH_MARKER, "_seededLists"]);

const OLD_VISA = "/visa-services";
const NEW_VISA = "/visa";
/** Menus whose visa item the owner renamed to "Visa" (the footer column keeps its longer label). */
const NAV_MENUS = new Set(["header", "drawer"]);

/** "/visa-services", "/visa-services/thailand", "/visa-services?region=asia" → the same under /visa. */
export function moveVisaPath(value: string): string {
  if (value === OLD_VISA) return NEW_VISA;
  if (/^\/visa-services[/?#]/.test(value)) return NEW_VISA + value.slice(OLD_VISA.length);
  return value;
}

/** Every string in a stored JSON value with its visa link moved; other values are kept as they are. */
export function moveVisaLinks(value: unknown): unknown {
  if (typeof value === "string") return moveVisaPath(value);
  if (Array.isArray(value)) return value.map(moveVisaLinks);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, moveVisaLinks(item)]),
    );
  }
  return value;
}

/** A header or drawer menu with its "Visa Services" item renamed to "Visa"; any other value as it is. */
export function renameVisaNavItem(menu: unknown): unknown {
  if (!menu || typeof menu !== "object" || Array.isArray(menu)) return menu;
  const record = menu as { key?: unknown; items?: unknown };
  if (typeof record.key !== "string" || !NAV_MENUS.has(record.key)) return menu;
  if (!Array.isArray(record.items)) return menu;
  return {
    ...record,
    items: record.items.map((item: unknown) => {
      if (!item || typeof item !== "object") return item;
      const entry = item as { label?: unknown; href?: unknown };
      return entry.label === "Visa Services" && entry.href === NEW_VISA
        ? { ...entry, label: "Visa" }
        : item;
    }),
  };
}

const json = (value: unknown) => value as Prisma.InputJsonValue;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Issue 176: visa moved from /visa-services to /visa. Stored links (menus, banners, buttons, articles) follow it and
 * the header and drawer item reads "Visa", as the owner asked. Only exact old paths change; admin wording elsewhere
 * stays. Returns the number of records changed.
 */
async function visaRoute(prisma: PrismaClient): Promise<number> {
  let changed = 0;
  for (const row of await prisma.contentDocument.findMany()) {
    let data = moveVisaLinks(row.data);
    if (row.collection === "menus") data = renameVisaNavItem(data);
    if (same(data, row.data)) continue;
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: row.collection, docId: row.docId } },
      data: { data: json(data), version: { increment: 1 }, updatedBy: "seed-patch" },
    });
    changed += 1;
  }
  for (const row of await prisma.setting.findMany()) {
    if (INTERNAL_KEYS.has(row.key)) continue;
    const value = moveVisaLinks(row.value);
    if (same(value, row.value)) continue;
    await prisma.setting.update({
      where: { key: row.key },
      data: { value: json(value), version: { increment: 1 }, updatedBy: "seed-patch" },
    });
    changed += 1;
  }
  return changed;
}

const MAIN_PHONE = "+8801823232241";
const SECOND_PHONE = { display: "01823-232242", e164: "+8801823232242" };

/**
 * The stored contact settings with the office's second number added after the main one (issue 181). Only when the
 * main number is still 01823-232241 and an admin has not set extra numbers yet; any other value is returned as it is.
 */
export function addSecondPhone(contact: unknown): unknown {
  if (!contact || typeof contact !== "object" || Array.isArray(contact)) return contact;
  const record = contact as { phoneE164?: unknown; extraPhones?: unknown };
  if (record.phoneE164 !== MAIN_PHONE) return contact;
  if (Array.isArray(record.extraPhones) && record.extraPhones.length > 0) return contact;
  return { ...record, extraPhones: [SECOND_PHONE] };
}

/** Issue 181: the live contact settings gain the second office number, 01823-232242. */
async function secondPhone(prisma: PrismaClient): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "contactSettings" } });
  if (!row) return 0;
  const value = addSecondPhone(row.value);
  if (same(value, row.value)) return 0;
  await prisma.setting.update({
    where: { key: row.key },
    data: { value: json(value), version: { increment: 1 }, updatedBy: "seed-patch" },
  });
  return 1;
}

/** One-time data changes that ship with the code, in order. Never edit a shipped patch; add a new one. */
export const SEED_PATCHES: ReadonlyArray<{
  id: string;
  apply: (prisma: PrismaClient) => Promise<number>;
}> = [
  { id: "2026-10-13-visa-route", apply: visaRoute },
  { id: "2026-10-14-second-phone", apply: secondPhone },
];

export type PatchResult = { applied: string[]; changed: number };

/**
 * Runs the patches this database has not had yet and records each one (issue 176). Safe on every deploy: an applied
 * patch is skipped, and each one changes only the values it names. Every changed record gets an audit log entry.
 */
export async function applySeedPatches(prisma: PrismaClient): Promise<PatchResult> {
  const marker = await prisma.setting.findUnique({ where: { key: PATCH_MARKER } });
  const done = new Set(Array.isArray(marker?.value) ? (marker.value as string[]) : []);
  const applied: string[] = [];
  let changed = 0;
  for (const patch of SEED_PATCHES) {
    if (done.has(patch.id)) continue;
    const count = await patch.apply(prisma);
    changed += count;
    done.add(patch.id);
    applied.push(patch.id);
    await prisma.setting.upsert({
      where: { key: PATCH_MARKER },
      update: { value: json([...done]) },
      create: { key: PATCH_MARKER, value: json([...done]), updatedBy: "seed" },
    });
    await prisma.auditLog.create({
      data: {
        actorName: "Deploy seed",
        action: "seed.patch",
        entity: "content",
        entityId: patch.id,
        after: json({ changed: count }),
      },
    });
  }
  return { applied, changed };
}
