import { PROVIDER_CATALOG, validateProviderConnection, type ProviderId } from "@waafa/shared";
import type { Prisma, PrismaClient } from "../generated/prisma/client";
import { nextReference } from "../common/references";
import { SecretBox } from "../providers/secretBox";
import { OLD_STORE_TEXTS } from "./storeRenameTexts";

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

/** The Home title and description the seed shipped with at launch, and what replaces them (issue 184). */
const HOME_SEO = {
  title: {
    from: "Waafa Tours and Travel · Flights, tours and visas from Dhaka",
    to: "Waafa Tours and Travel: Travel Agency in Dhaka, Bangladesh",
  },
  description: {
    from: "Flights, hotels, tour packages and visas from our Motijheel office, plus Waafas World by Waafa International. A real person confirms every price.",
    to: "Air tickets, visa processing, tour packages and hotel booking from our Motijheel office in Dhaka, plus Waafas World by Waafa International.",
  },
} as const;

/**
 * The stored site settings with the Home title and description written for search (issue 184): each field changes
 * only while it still holds the launch text, so wording an admin chose stays. Any other value is returned as it is.
 */
export function updateHomeSeo(settings: unknown): unknown {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return settings;
  const record = settings as { defaultSeo?: unknown };
  const seo = record.defaultSeo;
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) return settings;
  const current = seo as { title?: unknown; description?: unknown };
  const next = { ...current };
  if (current.title === HOME_SEO.title.from) next.title = HOME_SEO.title.to;
  if (current.description === HOME_SEO.description.from) {
    next.description = HOME_SEO.description.to;
  }
  return { ...record, defaultSeo: next };
}

/** Issue 184: the live Home title and description name the services and Dhaka for search. */
async function homeSeo(prisma: PrismaClient): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "siteSettings" } });
  if (!row) return 0;
  const value = updateHomeSeo(row.value);
  if (same(value, row.value)) return 0;
  await prisma.setting.update({
    where: { key: row.key },
    data: { value: json(value), version: { increment: 1 }, updatedBy: "seed-patch" },
  });
  return 1;
}

/** The emails status automation sends (D0 R4), as the fixtures define them; admin-editable afterwards. */
export const WORKFLOW_TEMPLATES = [
  {
    key: "payment-proof-rejected-customer",
    audience: "Customer",
    channel: "email",
    subject: "We could not confirm your payment for {{reference}}",
    body: "Dear {{name}},\n\nWe could not confirm the payment of {{amount}} you sent for {{reference}}: {{reason}}\n\nPlease send a new payment proof or call us, and we will confirm your order.",
    variables: ["{{name}}", "{{reference}}", "{{amount}}", "{{reason}}"],
    enabled: true,
  },
  {
    key: "lead-overdue-staff",
    audience: "Managers",
    channel: "email",
    subject: "No reply yet: {{reference}}",
    body: "{{name}}'s request {{reference}} has had no reply for {{minutes}} minutes.\n\nReply now in Admin: {{link}}.",
    variables: ["{{name}}", "{{reference}}", "{{minutes}}", "{{link}}"],
    enabled: true,
  },
] as const;

/** D0 R4: the two new email templates join the live list; an existing template with the same key is left as it is. */
async function workflowTemplates(prisma: PrismaClient): Promise<number> {
  let changed = 0;
  const last = await prisma.contentDocument.findFirst({
    where: { collection: "notificationTemplates" },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let position = (last?.position ?? -1) + 1;
  for (const template of WORKFLOW_TEMPLATES) {
    const exists = await prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: "notificationTemplates", docId: template.key } },
      select: { docId: true },
    });
    if (exists) continue;
    await prisma.contentDocument.create({
      data: {
        collection: "notificationTemplates",
        docId: template.key,
        data: json(template),
        position,
        updatedBy: "seed-patch",
      },
    });
    position += 1;
    changed += 1;
  }
  return changed;
}

/** D0 R9: staff added without a password get an invite email to choose one. */
const INVITE_TEMPLATE = {
  key: "staff-invite",
  audience: "Staff, when added",
  channel: "email",
  subject: "You're invited to Waafa Admin",
  body: "Hello {{name}},\n\n{{inviter}} added you to Waafa Admin. Choose your password here: {{link}}\n\nThe link works for 7 days. If you weren't expecting this, you can ignore this email.",
  variables: ["{{name}}", "{{inviter}}", "{{link}}"],
  enabled: true,
} as const;

/** The invite template joins the live list at its end; an existing template with the same key is left as it is. */
async function staffInviteTemplate(prisma: PrismaClient): Promise<number> {
  const exists = await prisma.contentDocument.findUnique({
    where: {
      collection_docId: { collection: "notificationTemplates", docId: INVITE_TEMPLATE.key },
    },
    select: { docId: true },
  });
  if (exists) return 0;
  const last = await prisma.contentDocument.findFirst({
    where: { collection: "notificationTemplates" },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.contentDocument.create({
    data: {
      collection: "notificationTemplates",
      docId: INVITE_TEMPLATE.key,
      data: json(INVITE_TEMPLATE),
      position: (last?.position ?? -1) + 1,
      updatedBy: "seed-patch",
    },
  });
  return 1;
}

/** The low-stock alert (issue 233), as fixtures/src/settings.ts has it. */
const LOW_STOCK_TEMPLATE = {
  key: "low-stock-staff",
  audience: "Waafas World team",
  channel: "email",
  subject: "Low stock: {{product}}",
  body: "{{product}} ({{sku}}) is down to {{stock}} after order {{order_number}}.\n\nRestock or update it in Admin: {{link}}.",
  variables: ["{{product}}", "{{sku}}", "{{stock}}", "{{order_number}}", "{{link}}"],
  enabled: true,
} as const;

/** The low-stock template joins the live list at its end; an existing one with that key is left as it is. */
async function lowStockTemplate(prisma: PrismaClient): Promise<number> {
  const exists = await prisma.contentDocument.findUnique({
    where: {
      collection_docId: { collection: "notificationTemplates", docId: LOW_STOCK_TEMPLATE.key },
    },
    select: { docId: true },
  });
  if (exists) return 0;
  const last = await prisma.contentDocument.findFirst({
    where: { collection: "notificationTemplates" },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.contentDocument.create({
    data: {
      collection: "notificationTemplates",
      docId: LOW_STOCK_TEMPLATE.key,
      data: json(LOW_STOCK_TEMPLATE),
      position: (last?.position ?? -1) + 1,
      updatedBy: "seed-patch",
    },
  });
  return 1;
}

/** The new-device sign-in email (issue 234), as fixtures/src/settings.ts has it. */
const NEW_DEVICE_TEMPLATE = {
  key: "staff-new-device",
  audience: "Staff, on a new device",
  channel: "email",
  subject: "New sign-in to Waafa Admin",
  body: "Hello {{name}},\n\nYour Waafa Admin account was just signed in to from a new device: {{device}}, address {{address}}, on {{time}}.\n\nIf this was you, there is nothing to do. If not, change your password now in My account ({{link}}) and tell the Super Admin.",
  variables: ["{{name}}", "{{device}}", "{{address}}", "{{time}}", "{{link}}"],
  enabled: true,
} as const;

/** The code-step lock email (issue 234 review), as fixtures/src/settings.ts has it. */
const CODE_LOCKED_TEMPLATE = {
  key: "staff-code-locked",
  audience: "Staff, when sign-in pauses at the code",
  channel: "email",
  subject: "Sign-in to Waafa Admin paused",
  body: "Hello {{name}},\n\nSomeone typed your correct password and then wrong sign-in codes several times (address {{address}}, {{time}}), so sign-in is paused for a while.\n\nIf this wasn't you, your password is known: change it now in My account ({{link}}) and tell the Super Admin.",
  variables: ["{{name}}", "{{address}}", "{{time}}", "{{link}}"],
  enabled: true,
} as const;

/** The customer sign-in code email (issue 241), as fixtures/src/settings.ts has it. */
const CUSTOMER_CODE_TEMPLATE = {
  key: "customer-sign-in-code",
  audience: "Customer, when signing in",
  channel: "email",
  subject: "Your Waafa sign-in code",
  body: "Your Waafa sign-in code is {{code}}.\n\nType it on the sign-in page within {{minutes}} minutes. It works once.\n\nNever share this code: Waafa staff will never ask for it. If you didn't try to sign in, you can ignore this email.",
  variables: ["{{code}}", "{{minutes}}"],
  enabled: true,
} as const;

/** The customer code template joins the live list the same way (staff edits to an existing one are kept). */
async function customerCodeTemplate(prisma: PrismaClient): Promise<number> {
  return appendTemplate(prisma, CUSTOMER_CODE_TEMPLATE);
}

/** The new-device template joins the live list at its end; an existing one with that key is left as it is. */
async function newDeviceTemplate(prisma: PrismaClient): Promise<number> {
  return appendTemplate(prisma, NEW_DEVICE_TEMPLATE);
}

/** The code-step lock template joins the live list the same way. */
/** Issue 239: disk and memory alerts to the people who get "system" alerts (STAFF_ALERT_EMAIL until someone is chosen). */
const SYSTEM_ALERT_TEMPLATE = {
  key: "system-alert-staff",
  audience: "Admins, system alerts",
  channel: "email",
  subject: "Server running low: {{what}}",
  body: "The website server is running low on {{what}}: {{detail}}.\n\nOpen Settings › System status for the details: {{link}}.",
  variables: ["{{what}}", "{{detail}}", "{{link}}"],
  enabled: true,
};

async function systemAlertTemplate(prisma: PrismaClient): Promise<number> {
  return appendTemplate(prisma, SYSTEM_ALERT_TEMPLATE);
}

async function codeLockedTemplate(prisma: PrismaClient): Promise<number> {
  return appendTemplate(prisma, CODE_LOCKED_TEMPLATE);
}

/** Adds a message template at the end of the live list unless one with its key exists (staff edits are kept). */
async function appendTemplate(
  prisma: PrismaClient,
  template: { key: string } & Record<string, unknown>,
): Promise<number> {
  const exists = await prisma.contentDocument.findUnique({
    where: {
      collection_docId: { collection: "notificationTemplates", docId: template.key },
    },
    select: { docId: true },
  });
  if (exists) return 0;
  const last = await prisma.contentDocument.findFirst({
    where: { collection: "notificationTemplates" },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.contentDocument.create({
    data: {
      collection: "notificationTemplates",
      docId: template.key,
      data: json(template),
      position: (last?.position ?? -1) + 1,
      updatedBy: "seed-patch",
    },
  });
  return 1;
}

/** Server values a patch may read (issue 284): only to move keys from the .env into Admin. */
export type PatchEnv = {
  PROVIDER_SECRET_KEY?: string | undefined;
  TURNSTILE_SITE_KEY?: string | undefined;
  TURNSTILE_SECRET_KEY?: string | undefined;
};

/** One integration card from values staff typed elsewhere before issue 284; an existing card is never touched. */
async function importCard(
  prisma: PrismaClient,
  provider: ProviderId,
  settings: Record<string, string>,
  secrets: Record<string, string> = {},
): Promise<number> {
  const definition = PROVIDER_CATALOG[provider];
  if (validateProviderConnection(definition, { settings, secrets }).length > 0) return 0;
  const existing = await prisma.integrationSetting.findUnique({ where: { provider } });
  if (existing) return 0;
  await prisma.providerCredential.upsert({
    where: { provider_environment: { provider, environment: "production" } },
    create: {
      provider,
      environment: "production",
      settings: json(settings),
      secrets: json(secrets),
      updatedBy: "seed-patch",
    },
    update: {},
  });
  await prisma.integrationSetting.create({
    data: {
      provider,
      kind: definition.kind,
      name: definition.name,
      isActive: true,
      isLive: true,
      updatedBy: "seed-patch",
    },
  });
  return 1;
}

/**
 * Issue 284: Admin › Integrations becomes the one place for outside services. The measurement IDs from Settings ›
 * Tracking, the verification codes from Site settings and the Turnstile keys from the server .env move onto their
 * cards (On, Live). Values that do not match the card's form are left for staff to type.
 */
async function integrationCards(prisma: PrismaClient, env: PatchEnv): Promise<number> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["trackingSettings", "siteSettings"] } },
  });
  const value = (key: string, field: string): string => {
    const record = rows.find((row) => row.key === key)?.value as
      Record<string, unknown> | undefined;
    const item = record?.[field];
    return typeof item === "string" ? item.trim() : "";
  };
  let changed = 0;
  const ga4 = value("trackingSettings", "ga4Id");
  if (ga4) changed += await importCard(prisma, "ga4", { measurementId: ga4 });
  const gtm = value("trackingSettings", "gtmId");
  if (gtm) changed += await importCard(prisma, "gtm", { containerId: gtm });
  const pixel = value("trackingSettings", "metaPixelId");
  if (pixel) changed += await importCard(prisma, "meta-pixel", { pixelId: pixel });
  const google =
    value("siteSettings", "googleSiteVerification") ||
    value("trackingSettings", "searchConsoleToken");
  if (google) changed += await importCard(prisma, "search-console", { token: google });
  const bing = value("siteSettings", "bingSiteVerification");
  if (bing) changed += await importCard(prisma, "bing", { token: bing });
  const siteKey = env.TURNSTILE_SITE_KEY?.trim();
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (siteKey && secret && env.PROVIDER_SECRET_KEY) {
    const box = new SecretBox(env.PROVIDER_SECRET_KEY);
    changed += await importCard(prisma, "turnstile", { siteKey }, { secretKey: box.seal(secret) });
  }
  return changed;
}

/**
 * Issue 242: leads that were booked before the Bookings module get their booking record (amount from the lead, status
 * confirmed, unpaid), so staff can add the PNR and payments. Leads that already have one are skipped.
 */
/** Issue 298: the quote email to the customer and the "quote accepted" alert join the live list. */
const QUOTE_TEMPLATES = [
  {
    key: "quote-customer",
    audience: "Customer, with a quote",
    channel: "email",
    subject: "Your quote {{reference}} from Waafa Tours and Travel",
    body: "Hello {{name}},\n\nHere is your quote {{reference}} for {{summary}}: {{options}}, valid until {{valid_until}}.\n\nSee the options, download the PDF and accept the one you want: {{link}}\n\nPrices are indicative until our travel expert confirms them before payment. Reply to this email or call us with any question.",
    variables: [
      "{{name}}",
      "{{reference}}",
      "{{summary}}",
      "{{options}}",
      "{{valid_until}}",
      "{{link}}",
    ],
    enabled: true,
  },
  {
    key: "quote-accepted-staff",
    audience: "Staff, by module",
    channel: "email",
    subject: "Quote {{reference}} accepted by {{name}}",
    body: '{{name}} accepted "{{option}}" ({{price}}) on quote {{reference}} for {{lead_reference}}.\n\nConfirm the fare and convert the lead to a booking: {{link}}',
    variables: [
      "{{name}}",
      "{{reference}}",
      "{{option}}",
      "{{price}}",
      "{{lead_reference}}",
      "{{link}}",
    ],
    enabled: true,
  },
];

async function quoteTemplates(prisma: PrismaClient): Promise<number> {
  let changed = 0;
  for (const template of QUOTE_TEMPLATES) changed += await appendTemplate(prisma, template);
  return changed;
}

async function bookingsForBookedLeads(prisma: PrismaClient): Promise<number> {
  const leads = await prisma.lead.findMany({
    where: { status: "booked", booking: null },
    select: {
      id: true,
      module: true,
      amount: true,
      travelDate: true,
      closedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  for (const lead of leads) {
    const when = lead.closedAt ?? lead.createdAt;
    await prisma.$transaction(async (tx) => {
      const travel = /^d{4}-d{2}-d{2}$/.test(lead.travelDate ?? "")
        ? new Date(`${lead.travelDate}T00:00:00Z`)
        : null;
      await tx.booking.create({
        data: {
          reference: await nextReference(tx, "BKG", when),
          leadId: lead.id,
          module: lead.module,
          amount: lead.amount ?? 0,
          ...(travel ? { travelDate: travel } : {}),
          createdBy: "seed-patch",
          updatedBy: "seed-patch",
          createdAt: when,
        },
      });
    });
  }
  return leads.length;
}

const STORE_RENAMES = new Map(
  OLD_STORE_TEXTS.map((text) => [text, text.replaceAll("Waafas World", "Waafa’s World")]),
);

/** Every string in a stored JSON value that still equals a pre-302 default, renamed; other values are kept. */
export function renameStore(value: unknown): unknown {
  if (typeof value === "string") return STORE_RENAMES.get(value) ?? value;
  if (Array.isArray(value)) return value.map(renameStore);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renameStore(item)]));
  }
  return value;
}

/**
 * Issue 302: the store is "Waafa’s World". Stored menus, home and store copy, pages, team, timeline and message
 * templates follow, but only where a text still equals the default it shipped with; staff wording stays as it is.
 */
async function storeName(prisma: PrismaClient): Promise<number> {
  let changed = 0;
  for (const row of await prisma.contentDocument.findMany()) {
    const data = renameStore(row.data);
    if (same(data, row.data)) continue;
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: row.collection, docId: row.docId } },
      data: { data: json(data), version: { increment: 1 }, updatedBy: "seed-patch" },
    });
    changed += 1;
  }
  for (const row of await prisma.setting.findMany()) {
    if (INTERNAL_KEYS.has(row.key)) continue;
    const value = renameStore(row.value);
    if (same(value, row.value)) continue;
    await prisma.setting.update({
      where: { key: row.key },
      data: { value: json(value), version: { increment: 1 }, updatedBy: "seed-patch" },
    });
    changed += 1;
  }
  return changed;
}

/** One-time data changes that ship with the code, in order. Never edit a shipped patch; add a new one. */
export const SEED_PATCHES: ReadonlyArray<{
  id: string;
  apply: (prisma: PrismaClient, env: PatchEnv) => Promise<number>;
}> = [
  { id: "2026-10-13-visa-route", apply: visaRoute },
  { id: "2026-10-14-second-phone", apply: secondPhone },
  { id: "2026-10-14-home-seo", apply: homeSeo },
  { id: "2026-10-24-workflow-templates", apply: workflowTemplates },
  { id: "2026-10-25-staff-invite-template", apply: staffInviteTemplate },
  { id: "2026-10-26-low-stock-template", apply: lowStockTemplate },
  { id: "2026-10-26-new-device-template", apply: newDeviceTemplate },
  { id: "2026-10-26-code-locked-template", apply: codeLockedTemplate },
  { id: "2026-10-27-customer-code-template", apply: customerCodeTemplate },
  { id: "2026-10-28-integration-cards", apply: integrationCards },
  { id: "2026-10-29-system-alert-template", apply: systemAlertTemplate },
  { id: "2026-10-30-bookings-for-booked-leads", apply: bookingsForBookedLeads },
  { id: "2026-10-31-quote-templates", apply: quoteTemplates },
  { id: "2026-10-28-store-name", apply: storeName },
];

export type PatchResult = { applied: string[]; changed: number };

/**
 * Runs the patches this database has not had yet and records each one (issue 176). Safe on every deploy: an applied
 * patch is skipped, and each one changes only the values it names. Every changed record gets an audit log entry.
 */
export async function applySeedPatches(
  prisma: PrismaClient,
  env: PatchEnv = {},
): Promise<PatchResult> {
  const marker = await prisma.setting.findUnique({ where: { key: PATCH_MARKER } });
  const done = new Set(Array.isArray(marker?.value) ? (marker.value as string[]) : []);
  const applied: string[] = [];
  let changed = 0;
  for (const patch of SEED_PATCHES) {
    if (done.has(patch.id)) continue;
    const count = await patch.apply(prisma, env);
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
