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
  "2026-10-26-code-locked-template",
  "2026-10-27-customer-code-template",
  "2026-10-28-integration-cards",
  "2026-10-29-system-alert-template",
  "2026-10-30-bookings-for-booked-leads",
  "2026-10-31-quote-templates",
  "2026-10-28-store-name",
  "2026-11-02-summary-template",
  "2026-11-04-incomplete-template",
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

  it("adds the quote email and the quote-accepted alert to a live list once, keeping one an admin already wrote (issue 298)", async () => {
    await prisma.contentDocument.deleteMany({
      where: {
        collection: "notificationTemplates",
        docId: { in: ["quote-customer", "quote-accepted-staff"] },
      },
    });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-31-quote-templates");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-31-quote-templates"],
      changed: 2,
    });
    const where = {
      collection_docId: { collection: "notificationTemplates", docId: "quote-customer" },
    };
    const added = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect(added.data).toMatchObject({ channel: "email", enabled: true });
    expect((added.data as { body: string }).body).toContain("{{link}}");
    await prisma.contentDocument.update({
      where,
      data: { data: { ...(added.data as object), subject: "Your Waafa quote" } },
    });
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-31-quote-templates"],
      changed: 0,
    });
    const kept = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect((kept.data as { subject: string }).subject).toBe("Your Waafa quote");
  });

  it("renames the store in stored text that still equals the old default and keeps staff wording (issue 302)", async () => {
    const site = await prisma.setting.findUniqueOrThrow({ where: { key: "siteSettings" } });
    await prisma.setting.update({
      where: { key: "siteSettings" },
      data: { value: { ...(site.value as object), storeName: "Waafas World" } },
    });
    const tabWhere = { collection_docId: { collection: "menus", docId: "tabbar" } };
    const tabbar = await prisma.contentDocument.findUniqueOrThrow({ where: tabWhere });
    const tabData = tabbar.data as { items: Array<{ id: string; label: string }> };
    await prisma.contentDocument.update({
      where: tabWhere,
      data: {
        data: {
          ...tabData,
          items: tabData.items.map((item) =>
            item.id === "tb-shop" ? { ...item, label: "Waafas World" } : item,
          ),
        } as Prisma.InputJsonValue,
      },
    });
    const footWhere = { collection_docId: { collection: "menus", docId: "footer-shop" } };
    const foot = await prisma.contentDocument.findUnique({ where: footWhere });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-28-store-name");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    const result = await applySeedPatches(prisma);
    expect(result.applied).toEqual(["2026-10-28-store-name"]);
    expect(result.changed).toBeGreaterThanOrEqual(2); // plus any template an earlier patch added with the old wording
    const renamed = await prisma.setting.findUniqueOrThrow({ where: { key: "siteSettings" } });
    expect((renamed.value as { storeName: string }).storeName).toBe("Waafa’s World");
    const tabs = await prisma.contentDocument.findUniqueOrThrow({ where: tabWhere });
    expect((tabs.data as { items: Array<{ id: string; label: string }> }).items).toContainEqual(
      expect.objectContaining({ id: "tb-shop", label: "Waafa’s World" }),
    );
    if (foot) {
      const after = await prisma.contentDocument.findUniqueOrThrow({ where: footWhere });
      expect(after.data).toEqual(foot.data);
    }

    // A name staff chose is never overwritten.
    await prisma.setting.update({
      where: { key: "siteSettings" },
      data: { value: { ...(renamed.value as object), storeName: "Waafas World Store" } },
    });
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-28-store-name"],
      changed: 0,
    });
    const kept = await prisma.setting.findUniqueOrThrow({ where: { key: "siteSettings" } });
    expect((kept.value as { storeName: string }).storeName).toBe("Waafas World Store");
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

  it("adds the customer sign-in code email to a live list once, keeping one an admin already wrote (issue 241)", async () => {
    await prisma.contentDocument.deleteMany({
      where: { collection: "notificationTemplates", docId: "customer-sign-in-code" },
    });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-27-customer-code-template");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-27-customer-code-template"],
      changed: 1,
    });
    const where = {
      collection_docId: { collection: "notificationTemplates", docId: "customer-sign-in-code" },
    };
    const added = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect(added.data).toMatchObject({ channel: "email", enabled: true });
    expect((added.data as { body: string }).body).toContain("{{code}}");
    await prisma.contentDocument.update({
      where,
      data: { data: { ...(added.data as object), subject: "Your code for Waafa" } },
    });
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });
    expect(await applySeedPatches(prisma)).toEqual({
      applied: ["2026-10-27-customer-code-template"],
      changed: 0,
    });
    const kept = await prisma.contentDocument.findUniqueOrThrow({ where });
    expect((kept.data as { subject: string }).subject).toBe("Your code for Waafa");
  });
  it("moves measurement IDs, verification codes and the .env Turnstile keys onto their cards once (issue 284)", async () => {
    await prisma.providerCredential.deleteMany({});
    await prisma.integrationSetting.deleteMany({});
    await prisma.setting.upsert({
      where: { key: "trackingSettings" },
      update: { value: { ga4Id: "G-ABC1234567", gtmId: "GTM-AB12CD3", metaPixelId: "12" } },
      create: {
        key: "trackingSettings",
        value: { ga4Id: "G-ABC1234567", gtmId: "GTM-AB12CD3", metaPixelId: "12" },
        updatedBy: "staff",
      },
    });
    // Staff already set GTM on its card: the patch leaves it alone.
    await prisma.integrationSetting.create({
      data: { provider: "gtm", kind: "analytics", name: "Google Tag Manager", updatedBy: "Owner" },
    });
    const others = ALL_PATCHES.filter((id) => id !== "2026-10-28-integration-cards");
    await prisma.setting.update({ where: { key: PATCH_MARKER }, data: { value: others } });

    const result = await applySeedPatches(prisma, {
      PROVIDER_SECRET_KEY: "test-provider-secret-key-0123456789-abcdef",
      TURNSTILE_SITE_KEY: "0x4AAAAAAAAbcdefghijkl",
      TURNSTILE_SECRET_KEY: "0x4AAAAAAAsecret",
    });
    expect(result).toEqual({ applied: ["2026-10-28-integration-cards"], changed: 2 });
    const cards = await prisma.integrationSetting.findMany({ orderBy: { provider: "asc" } });
    expect(
      cards.map((card) => [card.provider, card.isActive, card.isLive, card.updatedBy]),
    ).toEqual([
      ["ga4", true, true, "seed-patch"],
      ["gtm", false, false, "Owner"],
      ["turnstile", true, true, "seed-patch"],
    ]);
    const turnstile = await prisma.providerCredential.findUniqueOrThrow({
      where: { provider_environment: { provider: "turnstile", environment: "production" } },
    });
    expect(JSON.stringify(turnstile.secrets)).not.toContain("0x4AAAAAAAsecret");
    // The Pixel ID "12" is not a Pixel ID: left for staff to type.
    expect(
      await prisma.integrationSetting.findUnique({ where: { provider: "meta-pixel" } }),
    ).toBeNull();
  });
});
