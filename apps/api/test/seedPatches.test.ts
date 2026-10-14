import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/seed/seedDatabase";
import { applySeedPatches, PATCH_MARKER } from "../src/seed/seedPatches";
import { dbAvailable, resetDatabase, testPrisma } from "./helpers";

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
    expect(first.applied).toEqual(["2026-10-13-visa-route", "2026-10-14-second-phone"]);
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
    expect(marker.value).toEqual(["2026-10-13-visa-route", "2026-10-14-second-phone"]);
    expect(await prisma.auditLog.count({ where: { action: "seed.patch" } })).toBe(2);

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
      data: { value: ["2026-10-13-visa-route"] },
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
});
