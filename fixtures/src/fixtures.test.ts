import { describe, expect, it } from "vitest";
import { BookingModuleSchema, HomeSectionKeySchema, LEAD_PREFIX } from "@waafa/shared";
import { fixtureRegistry, loadFixtures, parseFixture, type FixtureKey } from "./index";

const data = loadFixtures();
const keys = Object.keys(fixtureRegistry) as FixtureKey[];

/** Visits every object nested anywhere in a value. */
function walk(
  value: unknown,
  visit: (node: Record<string, unknown>, path: string) => void,
  path = "$",
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, `${path}[${index}]`));
  } else if (value !== null && typeof value === "object") {
    const node = value as Record<string, unknown>;
    visit(node, path);
    for (const [key, child] of Object.entries(node)) walk(child, visit, `${path}.${key}`);
  }
}

/** Every string nested anywhere in a value. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function ids<T>(items: T[], pick: (item: T) => string): Set<string> {
  return new Set(items.map(pick));
}

function expectUnique<T>(items: T[], pick: (item: T) => string, what: string): void {
  const seen = items.map(pick);
  const duplicates = seen.filter((value, index) => seen.indexOf(value) !== index);
  expect(duplicates, `duplicate ${what}`).toEqual([]);
}

describe("every fixture parses with its schema", () => {
  it.each(keys)("%s", (key) => {
    expect(() => parseFixture(key)).not.toThrow();
  });
});

describe("Sample marking (CLAUDE.md)", () => {
  it("marks every record that has a sample flag as Sample", () => {
    const unmarked: string[] = [];
    walk(data, (node, path) => {
      if ("sample" in node && node.sample !== true) unmarked.push(path);
    });
    expect(unmarked).toEqual([]);
  });
});

describe("compliance (PRD §2 and the CLAUDE.md Never list)", () => {
  const text = strings(data);

  it("has no Hajj or Umrah products or copy", () => {
    expect(text.filter((value) => /hajj|umrah/i.test(value))).toEqual([]);
  });

  it("holds no trade licence data or owner details", () => {
    expect(
      text.filter((value) => /licen[cs]e|proprietor|managing director|\bowner\b/i.test(value)),
    ).toEqual([]);
    expect(data.team.map((member) => member.designation)).not.toContain("Managing Director");
  });

  it("mentions recruitment, manpower or work permits only to say we don’t do them", () => {
    const mentions = text.filter((value) =>
      /manpower|recruit|work permit|employment visa/i.test(value),
    );
    for (const mention of mentions) expect(mention).toMatch(/\b(do not|don’t|never|no)\b/i);
  });

  it("lists no restricted items in Waafas World", () => {
    const restricted =
      /weapon|knife|gun|ammunition|alcohol|liquor|tobacco|cigarette|vape|narcotic|drug|pharma|medicine|adult|explosive|firework/i;
    const listed = data.products.flatMap((product) =>
      strings([product.title, product.description, product.specs, product.highlights]),
    );
    expect(listed.filter((value) => restricted.test(value))).toEqual([]);
  });

  it("never publishes invented reviews: feedback fixtures are pending moderation only", () => {
    expect(data.feedback.every((item) => item.status === "pending")).toBe(true);
  });

  it("shows sample team members as initials, never stock faces", () => {
    expect(data.team.filter((member) => member.photo !== undefined)).toEqual([]);
  });

  it("contains no Bangladeshi mobile number except the company’s published one", () => {
    const company = "01823232241";
    const numbers = text.flatMap(
      (value) => value.replace(/[\s-]/g, "").match(/(?:\+?880)?01[3-9]\d{8}/g) ?? [],
    );
    expect(numbers.filter((number) => !number.endsWith(company))).toEqual([]);
  });

  it("uses real photos served from /images with a credit for every Unsplash photo", () => {
    const images: { path: string; src: string; credit: unknown }[] = [];
    walk(data, (node, path) => {
      if (typeof node.src === "string" && typeof node.alt === "string")
        images.push({ path, src: node.src, credit: node.credit });
    });
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image.src, image.path).toMatch(/^\/images\/(products\/)?[a-z0-9-]+\.jpg$/);
      if (!image.src.startsWith("/images/products/"))
        expect(image.credit, image.path).toMatch(/ · Unsplash$/);
    }
  });

  it("keeps the Golden Switch at launch: every module Manual with Live locked", () => {
    expect(data.bookingModes.map((mode) => mode.module).sort()).toEqual(
      [...BookingModuleSchema.options].sort(),
    );
    for (const mode of data.bookingModes) {
      expect(mode.mode).toBe("manual");
      expect(mode.liveLocked).toBe(true);
      expect(mode.lockReason).toBeTruthy();
    }
    expect(data.paymentSettings.onlinePaymentLive).toBe(false);
    expect(data.footerSettings.paymentMethods.find((method) => method.id === "card")?.enabled).toBe(
      false,
    );
  });
});

describe("settings integrity", () => {
  it("has all 13 home sections once, in a clear order", () => {
    expect(data.homeSections.map((section) => section.key).sort()).toEqual(
      [...HomeSectionKeySchema.options].sort(),
    );
    expectUnique(data.homeSections, (section) => String(section.order), "home section order");
  });

  it("points footer columns and the More panel at menus that exist", () => {
    const menuKeys = ids(data.menus, (menu) => menu.key);
    for (const column of data.footerSettings.columns)
      expect(menuKeys.has(column.menu), column.menu).toBe(true);
    expect(menuKeys.has("more")).toBe(true);
    expect(menuKeys.has("legal")).toBe(true);
    expectUnique(data.menus, (menu) => menu.key, "menu key");
  });

  it("declares every variable a notification template uses", () => {
    for (const template of data.notificationTemplates) {
      const used = `${template.subject} ${template.body}`.match(/\{\{[a-z_]+\}\}/g) ?? [];
      for (const variable of used)
        expect(template.variables, `${template.key} uses ${variable}`).toContain(variable);
    }
    expectUnique(data.notificationTemplates, (template) => template.key, "template key");
  });
});

describe("travel integrity", () => {
  const airportCodes = ids(data.airports, (airport) => airport.iata);
  const airlineCodes = ids(data.airlines, (airline) => airline.code);
  const packageSlugs = ids(data.tourPackages, (pkg) => pkg.slug);
  const visaSlugs = ids(data.visaCountries, (country) => country.slug);

  it("uses unique codes, ids and slugs", () => {
    expectUnique(data.airports, (airport) => airport.iata, "airport");
    expectUnique(data.airlines, (airline) => airline.code, "airline");
    expectUnique(data.groupFares, (fare) => fare.id, "group fare");
    expectUnique(data.tourPackages, (pkg) => pkg.id, "package id");
    expectUnique(data.tourPackages, (pkg) => pkg.slug, "package slug");
    expectUnique(data.destinations, (destination) => destination.slug, "destination");
  });

  it("pins the PRD airports first, in order (FR-SRCH-06)", () => {
    const pinned = data.airports
      .filter((airport) => airport.pinnedRank !== undefined)
      .sort((a, b) => (a.pinnedRank ?? 0) - (b.pinnedRank ?? 0));
    expect(pinned.map((airport) => airport.iata).join(" ")).toBe(
      "DAC CGP ZYL CXB JSR SPD RJH BZL DXB DOH KUL SIN BKK CCU DEL KTM MLE IST LHR JFK YYZ",
    );
  });

  it("links group fares, destinations and baggage rules to known airports and airlines", () => {
    for (const fare of data.groupFares) {
      expect(airportCodes.has(fare.from.iata) && airportCodes.has(fare.to.iata), fare.id).toBe(
        true,
      );
      expect(airlineCodes.has(fare.airline.code), fare.id).toBe(true);
    }
    for (const destination of data.destinations)
      expect(airportCodes.has(destination.iata), destination.slug).toBe(true);
    for (const rule of data.baggageRules)
      expect(airlineCodes.has(rule.airlineCode), rule.id).toBe(true);
  });

  it("links related packages and package visas to pages that exist", () => {
    for (const pkg of data.tourPackages) {
      for (const slug of pkg.relatedSlugs)
        expect(packageSlugs.has(slug), `${pkg.slug} → ${slug}`).toBe(true);
      if (pkg.visa?.countrySlug) expect(visaSlugs.has(pkg.visa.countrySlug), pkg.slug).toBe(true);
      expect(
        pkg.prices.some((price) => price.sharing === "twin" && price.price === pkg.fromPrice),
        pkg.slug,
      ).toBe(true);
      expect(
        pkg.nightsPerCity.reduce((sum, city) => sum + city.nights, 0),
        pkg.slug,
      ).toBe(pkg.durationNights);
    }
  });
});

describe("visa and content integrity", () => {
  it("links visa countries and guides both ways (FR-VGD-01)", () => {
    const countrySlugs = ids(data.visaCountries, (country) => country.slug);
    const guideSlugs = ids(data.visaGuides, (guide) => guide.slug);
    for (const country of data.visaCountries)
      if (country.guideSlug) expect(guideSlugs.has(country.guideSlug), country.slug).toBe(true);
    for (const guide of data.visaGuides)
      expect(countrySlugs.has(guide.countrySlug), guide.slug).toBe(true);
    expectUnique(data.visaCountries, (country) => country.slug, "visa country");
  });

  it("offers tourist, business, student, medical and transit visas only", () => {
    const types = new Set(
      data.visaCountries.flatMap((country) => country.types.map((type) => type.type)),
    );
    expect(
      [...types].every((type) =>
        ["tourist", "business", "student", "medical", "transit"].includes(type),
      ),
    ).toBe(true);
  });

  it("files blog posts under known categories and FAQs in a clear order", () => {
    const categorySlugs = ids(data.blogCategories, (category) => category.slug);
    for (const post of data.blogPosts)
      expect(categorySlugs.has(post.category), post.slug).toBe(true);
    expectUnique(data.blogPosts, (post) => post.slug, "blog slug");
    expect(data.faqs.filter((faq) => faq.onHome)).toHaveLength(5);
    expectUnique(data.faqs, (faq) => `${faq.category}:${faq.order}`, "FAQ order");
  });
});

describe("shop integrity", () => {
  const productIds = ids(data.products, (product) => product.id);
  const categoryIds = ids(data.categories, (category) => category.id);

  it("builds a category tree with known parents and attribute sets", () => {
    const byId = new Map(data.categories.map((category) => [category.id, category]));
    const setIds = ids(data.attributeSets, (set) => set.id);
    for (const category of data.categories) {
      if (category.parentId === null) {
        expect(category.level, category.slug).toBe(1);
      } else {
        const parent = byId.get(category.parentId);
        expect(parent, category.slug).toBeDefined();
        expect(category.level, category.slug).toBe((parent?.level ?? 0) + 1);
      }
      if (category.attributeSetId)
        expect(setIds.has(category.attributeSetId), category.slug).toBe(true);
    }
    expectUnique(data.categories, (category) => category.slug, "category slug");
  });

  it("links products to brands, categories, printer models and collections", () => {
    const brandIds = ids(data.brands, (brand) => brand.id);
    const modelIds = ids(data.compatibleModels, (model) => model.id);
    const collectionIds = ids(data.collections, (collection) => collection.id);
    const compatible = new Set(
      data.categories.filter((category) => category.compatibility).map((category) => category.id),
    );
    for (const product of data.products) {
      expect(brandIds.has(product.brandId), product.slug).toBe(true);
      expect(categoryIds.has(product.categoryId), product.slug).toBe(true);
      for (const id of product.compatibleModelIds)
        expect(modelIds.has(id), `${product.slug} → ${id}`).toBe(true);
      for (const id of product.collectionIds)
        expect(collectionIds.has(id), `${product.slug} → ${id}`).toBe(true);
      if (product.compatibleModelIds.length > 0)
        expect(compatible.has(product.categoryId), product.slug).toBe(true);
    }
    expectUnique(data.products, (product) => product.slug, "product slug");
    expectUnique(
      data.products.flatMap((product) => product.variants),
      (variant) => variant.sku,
      "SKU",
    );
  });

  it("points collections and deals at real products and variants", () => {
    for (const collection of data.collections) {
      if (collection.rule.type === "manual") {
        for (const id of collection.rule.productIds)
          expect(productIds.has(id), collection.slug).toBe(true);
      } else {
        for (const id of collection.rule.categoryIds ?? [])
          expect(categoryIds.has(id), collection.slug).toBe(true);
      }
    }
    for (const deal of data.deals) {
      const product = data.products.find((item) => item.id === deal.productId);
      const variant = product?.variants.find((item) => item.id === deal.variantId);
      expect(variant, deal.id).toBeDefined();
      expect(deal.dealPrice, deal.id).toBeLessThan(variant?.price ?? 0);
    }
  });

  it("adds up every order line and pays into a known offline account", () => {
    const accounts = ids(data.paymentSettings.offlineAccounts, (account) => account.id);
    for (const order of data.orders) {
      for (const item of order.items) {
        const variant = data.products
          .find((product) => product.id === item.productId)
          ?.variants.find((v) => v.id === item.variantId);
        expect(variant?.sku, order.reference).toBe(item.sku);
        expect(item.lineTotal, order.reference).toBe(item.unitPrice * item.quantity);
      }
      expect(order.subtotal, order.reference).toBe(
        order.items.reduce((sum, item) => sum + item.lineTotal, 0),
      );
      if (order.payment.method === "offline")
        expect(accounts.has(order.payment.accountId), order.reference).toBe(true);
      if (order.payment.method === "cod")
        expect(order.total, order.reference).toBeLessThanOrEqual(data.paymentSettings.codLimit);
    }
  });
});

describe("lead integrity", () => {
  it("prefixes every reference with its module code and links known records", () => {
    const staff = ids(data.staffUsers, (user) => user.id);
    for (const lead of data.leads) {
      expect(lead.reference.slice(0, 3), lead.id).toBe(LEAD_PREFIX[lead.module]);
      if (lead.assigneeId) expect(staff.has(lead.assigneeId), lead.id).toBe(true);
      const { payload } = lead;
      if (payload.module === "packages") {
        expect(
          data.tourPackages.some((pkg) => pkg.id === payload.packageId),
          lead.id,
        ).toBe(true);
      }
      if (payload.module === "flights" && payload.groupFareId) {
        expect(
          data.groupFares.some((fare) => fare.id === payload.groupFareId),
          lead.id,
        ).toBe(true);
      }
    }
    expectUnique(data.leads, (lead) => lead.reference, "lead reference");
  });
});
