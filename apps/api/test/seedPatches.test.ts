import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/seed/seedDatabase";
import { applySeedPatches, PATCH_MARKER } from "../src/seed/seedPatches";
import { dbAvailable, resetDatabase, testPrisma } from "./helpers";

/** Every shipped patch, in order. */
const ALL_PATCHES = [
  "2026-10-13-visa-route",
  "2026-10-14-second-phone",
  "2026-10-14-home-seo",
  "2026-10-24-workflow-templates",
  "2026-10-25-staff-invite-template",
  "2026-10-26-low-stock-template",
  "2026-10-26-new-device-template",
];

/** A record as the live site stored it before visa moved to /visa (issue 176). */
async function storeOld(prisma: PrismaClient) {
  const header = await prisma.contentDocument.findUniqueOrThrow({
    where: { collection_docId: { collection: "menus", docId: "header" } },
  });
  const data = header.data as {
    key: string;
    items: Array<{ id: string; label: string; href?: string }>;
  };
  const items = data.items.map((item) =>
    item.id === "visa" ? { ...item, label: "Visa Services", href: "/visa-services" } : item,
  );
  await prisma.contentDocument.update({
    where: { collection_docId: { collection: "menus", docId: "header" } },
    data: { data: { ...data, items } as Prisma.InputJsonValue },
  });
  const footer = await prisma.contentDocument.findFirstOrThrow({
    where: { collection: "menus", docId: { startsWith: "footer" } },
  });
  const footerData = footer.data as { items: Array<{ label: string; href?: string }> };
  await prisma.contentDocument.update({
    where: { collection_docId: { collection: "menus", docId: footer.docId } },
    data: {
      data: {
        ...footerData,
        items: [
          ...footerData.items,
          { id: "ft-old-visa", label: "Visa Services", href: "/visa-services/thailand" },
        ],
      } as Prisma.InputJsonValue,
    },
  });
  return footer.docId;
}

describe.skipIf(!dbAvailable)("seed patches (issue 176)", () => {
  let prisma: PrismaClient;
  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("moves stored visa links to /visa and renames the nav item, once", async () => {
    const footerKey = await storeOld(prisma);

    const first = await applySeedPatches(prisma);
    expect(first.applied).toEqual(ALL_PATCHES);
    expect(first.changed).toBeGreaterThanOrEqual(2);

    const header = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "menus", docId: "header" } },
    });
    const visa = (
      header.data as { items: Array<{ id: string; label: string; href?: string }> }
    ).items.find((item) => item.id === "visa");
    expect(visa).toMatchObject({ label: "Visa", href: "/visa" });
    expect(header.updatedBy).toBe("seed-patch");

    const footer = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "menus", docId: footerKey } },
    });
    const old = (
      footer.data as { items: Array<{ id: string; label: string; href?: string }> }
    ).items.find((item) => item.id === "ft-old-visa");
    // Footer links move too; the footer keeps its longer label.
    expect(old).toMatchObject({ label: "Visa Services", href: "/visa/thailand" });

    // No stored value points at the old path any more.
    const documents = await prisma.contentDocument.findMany();
    const settings = await prisma.setting.findMany();
    expect(
      JSON.stringify([documents.map((d) => d.data), settings.map((s) => s.value)]),
    ).not.toContain("/visa-services");

    const marker = await prisma.setting.findUniqueOrThrow({ where: { key: PATCH_MARKER } });
    expect(marker.value).toEqual(ALL_PATCHES);
    expect(await prisma.auditLog.count({ where: { action: "seed.patch" } })).toBe(
      ALL_PATCHES.length,
    );

    // A later deploy skips it, so a label the admin sets afterwards is kept.
    await storeOld(prisma);
    const second = await applySeedPatches(prisma);
    expect(second).toEqual({ applied: [], changed: 0 });
    const kept = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "menus", docId: "header" } },
    });
    expect(JSON.stringify(kept.data)).toContain("Visa Services");
  });
  it("adds the second office number to a live contact that has only the main one (issue 181)", async () => {
    const stored = await prisma.setting.findUniqueOrThrow({ where: { key: "contactSettings" } });
    const { extraPhones: _seeded, ...live } = stored.value as Record<string, unknown>;
    await prisma.setting.update({
      where: { key: "contactSettings" },
      data: { value: live as Prisma.InputJsonValue },
    });
    await prisma.setting.update({
      where: { key: PATCH_MARKER },
      data: { value: ALL_PATCHES.filter((id) => id !== "2026-10-14-second-phone") },
    });

    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-14-second-phone"],
      changed: 1,
    });
    const patched = await prisma.setting.findUniqueOrThrow({ where: { key: "contactSettings" } });
    expect(patched.value).toMatchObject({
      phoneE164: "+8801823232241",
      extraPhones: [{ display: "01823-232242", e164: "+8801823232242" }],
    });
    expect(patched.updatedBy).toBe("seed-patch");
  });
  it("writes the Home title and description for search, keeping wording an admin chose (issue 184)", async () => {
    const stored = await prisma.setting.findUniqueOrThrow({ where: { key: "siteSettings" } });
    const launch = {
      ...(stored.value as Record<string, unknown>),
      defaultSeo: {
        title: "Waafa Tours and Travel · Flights, tours and visas from Dhaka",
        description: "Our own description",
      },
    };
    await prisma.setting.update({
      where: { key: "siteSettings" },
      data: { value: launch as Prisma.InputJsonValue },
    });
    await prisma.setting.update({
      where: { key: PATCH_MARKER },
      data: { value: ALL_PATCHES.filter((id) => id !== "2026-10-14-home-seo") },
    });

    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-14-home-seo"],
      changed: 1,
    });
    const patched = await prisma.setting.findUniqueOrThrow({ where: { key: "siteSettings" } });
    expect((patched.value as { defaultSeo: unknown }).defaultSeo).toEqual({
      title: "Waafa Tours and Travel: Travel Agency in Dhaka, Bangladesh",
      description: "Our own description",
    });
  });
  it("adds the status automation emails to a live list, keeping one an admin already wrote (D0 R4)", async () => {
    // The live list was seeded before these templates existed; an admin wrote one of them by hand.
    await prisma.contentDocument.deleteMany({
      where: { collection: "notificationTemplates", docId: "payment-proof-rejected-customer" },
    });
    const own = await prisma.contentDocument.findUniqueOrThrow({
      where: {
        collection_docId: { collection: "notificationTemplates", docId: "lead-overdue-staff" },
      },
    });
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: "notificationTemplates", docId: own.docId } },
      data: { data: { ...(own.data as object), subject: "Our own subject" } },
    });
    await prisma.setting.update({
      where: { key: PATCH_MARKER },
      data: { value: ALL_PATCHES.filter((id) => id !== "2026-10-24-workflow-templates") },
    });

    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-24-workflow-templates"],
      changed: 1,
    });
    const rows = await prisma.contentDocument.findMany({
      where: {
        collection: "notificationTemplates",
        docId: { in: ["payment-proof-rejected-customer", "lead-overdue-staff"] },
      },
    });
    expect(rows.map((row) => (row.data as { subject: string }).subject).sort()).toEqual([
      "Our own subject",
      "We could not confirm your payment for {{reference}}",
    ]);
  });
  it("adds the staff invite email to a live list once, keeping one an admin already wrote (D0 R9)", async () => {
    await prisma.contentDocument.deleteMany({
      where: { collection: "notificationTemplates", docId: "staff-invite" },
    });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-25-staff-invite-template");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });

    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-25-staff-invite-template"],
      changed: 1,
    });
    const added = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "notificationTemplates", docId: "staff-invite" } },
    });
    expect(added.data).toMatchObject({ channel: "email", enabled: true });
    expect(added.updatedBy).toBe("seed-patch");

    // Run again on a list that already has it (say an admin's own wording): nothing changes.
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: "notificationTemplates", docId: "staff-invite" } },
      data: { data: { ...(added.data as object), subject: "Welcome aboard" } },
    });
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-25-staff-invite-template"],
      changed: 0,
    });
    const kept = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "notificationTemplates", docId: "staff-invite" } },
    });
    expect((kept.data as { subject: string }).subject).toBe("Welcome aboard");
  });

  it("adds the low-stock email to a live list once, keeping one an admin already wrote (issue 233)", async () => {
    await prisma.contentDocument.deleteMany({
      where: { collection: "notificationTemplates", docId: "low-stock-staff" },
    });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-26-low-stock-template");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-26-low-stock-template"],
      changed: 1,
    });
    const where = {
      collection_docId: { collection: "notificationTemplates", docId: "low-stock-staff" },
    };
    const added = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect(added.data).toMatchObject({ channel: "email", enabled: true });
    await prisma.contentDocument.update({
      where,
      data: { data: { ...(added.data as object), subject: "Stock running out" } },
    });
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-26-low-stock-template"],
      changed: 0,
    });
    const kept = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect((kept.data as { subject: string }).subject).toBe("Stock running out");
  });

  it("adds the new-device sign-in email to a live list once, keeping one an admin already wrote (issue 234)", async () => {
    await prisma.contentDocument.deleteMany({
      where: { collection: "notificationTemplates", docId: "staff-new-device" },
    });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-26-new-device-template");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-26-new-device-template"],
      changed: 1,
    });
    const where = {
      collection_docId: { collection: "notificationTemplates", docId: "staff-new-device" },
    };
    const added = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect(added.data).toMatchObject({ channel: "email", enabled: true });
    await prisma.contentDocument.update({
      where,
      data: { data: { ...(added.data as object), subject: "Was this you?" } },
    });
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-26-new-device-template"],
      changed: 0,
    });
    const kept = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect((kept.data as { subject: string }).subject).toBe("Was this you?");
  });
});
