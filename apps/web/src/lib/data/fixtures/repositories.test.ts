import { loadFixtures, type FixtureData } from "@waafa/fixtures";
import { LeadCreateInputSchema, parseReference, type LeadCreateInput } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { createFixtureRepositories } from "./createFixtureRepositories";
import { productFromPrice } from "./shopRepository";

const { settings, content, travel, visa, shop } = createFixtureRepositories();

/** A Dhaka wall-clock moment, e.g. dhaka("2026-10-10T11:00"). */
function dhaka(iso: string): Date {
  return new Date(`${iso}:00+06:00`);
}

/** Fixtures with some records changed, for states the Sample data does not include. */
function withData(patch: Partial<FixtureData>) {
  return createFixtureRepositories({ ...loadFixtures(), ...patch });
}

describe("settings repository", () => {
  it("serves the Golden Switch state for every module (FR-GS-02)", async () => {
    const config = await settings.getPublicConfig();
    expect(Object.keys(config.modes).sort()).toEqual([
      "flights",
      "hotels",
      "packages",
      "shopPayment",
    ]);
    expect(config.modes.flights).toMatchObject({ mode: "manual", liveLocked: true });
    expect(config.modes.flights.lockReason).toBeTruthy();
    expect(config.codLimit).toBe(20000);
    expect(config.maintenance.enabled).toBe(false);
  });

  it("lists only visible menu items and live payment methods", async () => {
    const header = await settings.getMenu("header");
    expect(header.items.map((item) => item.label)).toEqual([
      "Home",
      "Tour Packages",
      "Visa Services",
      "Waafas World",
      "Gallery",
      "Feedback",
      "More",
    ]);
    const hidden = withData({
      menus: loadFixtures().menus.map((menu) =>
        menu.key === "header"
          ? {
              ...menu,
              items: menu.items.map((item) => ({ ...item, visible: item.id !== "gallery" })),
            }
          : menu,
      ),
    });
    expect((await hidden.settings.getMenu("header")).items.map((item) => item.id)).not.toContain(
      "gallery",
    );
    const footer = await settings.getFooterSettings();
    expect(footer.paymentMethods.map((method) => method.id)).not.toContain("card");
  });

  it("shows the announcement only inside its date range", async () => {
    expect(await settings.getActiveAnnouncement(dhaka("2026-10-10T09:00"))).not.toBeNull();
    expect(await settings.getActiveAnnouncement(dhaka("2026-09-30T23:00"))).toBeNull();
    expect(await settings.getActiveAnnouncement(dhaka("2026-12-16T00:01"))).toBeNull();
  });

  it("returns enabled home sections in admin order", async () => {
    const sections = await settings.listHomeSections();
    expect(sections[0]?.key).toBe("hero");
    expect(sections.map((section) => section.key)).not.toContain("testimonials");
    expect(sections.map((section) => section.order)).toEqual(
      [...sections.map((section) => section.order)].sort((a, b) => a - b),
    );
  });
});

describe("content repository", () => {
  it("serves page media slots, real footage on the home hero and nothing for an empty slot", async () => {
    const hero = await content.getMediaSlot("home-hero");
    expect(hero?.video?.mp4).toBe("/media/video/hero-sky.mp4");
    expect(hero?.video?.mp4Mobile).toBe("/media/video/hero-sky-m.mp4");
    expect(hero?.video?.credit).toMatch(/ · (Pexels|Mixkit|Coverr)$/);
    expect(await content.getMediaSlot("office")).toBeNull();
    const keys = (await content.listMediaSlots()).map((slot) => slot.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("serves published pages by slug, with sections for the contents list", async () => {
    const refund = await content.getPage("refund-policy");
    expect(refund?.sections.map((section) => section.id)).toContain("how");
    expect(await content.getPage("no-such-page")).toBeNull();
    const about = await content.getPage("about-us");
    expect(about?.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["our-story", "mission", "vision"]),
    );
  });

  it("lists blog posts newest first, filters and paginates them", async () => {
    const first = await content.listBlogPosts({ limit: 3 });
    expect(first.items).toHaveLength(3);
    expect(first.nextOffset).toBe(3);
    expect(first.items[0]?.slug).toBe("coxs-bazar-long-weekend");
    const dates = (await content.listBlogPosts({ limit: 50 })).items.map(
      (post) => post.publishedAt,
    );
    expect(dates).toEqual([...dates].sort().reverse());
    const visaPosts = await content.listBlogPosts({ category: "visa" });
    expect(visaPosts.items.every((post) => post.category === "visa")).toBe(true);
    expect(
      (await content.listBlogPosts({ search: "power bank" })).items.map((post) => post.slug),
    ).toEqual(["flying-with-a-power-bank"]);
  });

  it("suggests related posts from the same category first", async () => {
    const related = await content.listRelatedBlogPosts("sajek-valley-when-to-go", 3);
    expect(related).toHaveLength(3);
    expect(related.map((post) => post.slug)).not.toContain("sajek-valley-when-to-go");
    expect(related[0]?.category).toBe("destinations");
  });

  it("returns exactly five home FAQs and searches answers too", async () => {
    expect(await content.listFaqs({ onHome: true })).toHaveLength(5);
    const cod = await content.listFaqs({ search: "cash on delivery" });
    expect(cod.map((faq) => faq.id)).toContain("faq-cod");
  });

  it("shows banners only while scheduled and enabled", async () => {
    const early = await content.listBanners("home-offers", dhaka("2026-10-10T10:00"));
    expect(early.map((banner) => banner.id)).toEqual([
      "offer-bali-5d",
      "offer-student-kul",
      "offer-sajek-winter",
    ]);
    const later = await content.listBanners("home-offers", dhaka("2026-12-20T10:00"));
    expect(later.map((banner) => banner.id)).not.toContain("offer-bali-5d");
    expect(await content.listBanners("home-offers", dhaka("2026-09-01T10:00"))).toEqual([]);
  });

  it("never exposes feedback contact details and shows approved, consented items only", async () => {
    expect(await content.listPublicFeedback()).toEqual([]);
    const approved = withData({
      feedback: loadFixtures().feedback.map((item) => ({ ...item, status: "approved" as const })),
    });
    const wall = await approved.content.listPublicFeedback();
    expect(wall.map((item) => item.id)).toEqual(["fb-sample-1"]);
    expect(wall[0]).not.toHaveProperty("contact");
    expect(wall[0]).not.toHaveProperty("consentToPublish");
  });

  it("puts the featured team member first and respects Home and About placement", async () => {
    const team = await content.listTeam("home");
    expect(team[0]?.featured).toBe(true);
    const hiddenOnHome = withData({
      team: loadFixtures().team.map((member) =>
        member.id === "team-ta" ? { ...member, showOnHome: false } : member,
      ),
    });
    expect((await hiddenOnHome.content.listTeam("home")).map((member) => member.id)).not.toContain(
      "team-ta",
    );
    expect((await hiddenOnHome.content.listTeam("about")).map((member) => member.id)).toContain(
      "team-ta",
    );
  });

  it("filters baggage rules by route type and airline", async () => {
    const domestic = await content.listBaggageRules({ scope: "domestic" });
    expect(domestic.every((rule) => rule.scope === "domestic")).toBe(true);
    expect(
      (await content.listBaggageRules({ search: "emirates" })).map((rule) => rule.airlineCode),
    ).toEqual(["EK"]);
  });
});

describe("travel repository", () => {
  it("lists the pinned airports in PRD order", async () => {
    const pinned = await travel.listPinnedAirports();
    expect(pinned.slice(0, 3).map((airport) => airport.iata)).toEqual(["DAC", "CGP", "ZYL"]);
  });

  it("builds the Home airline strip from the admin order", async () => {
    const strip = await travel.listFeaturedAirlines();
    expect(strip).toHaveLength(12);
    expect(strip.slice(0, 3).map((airline) => airline.code)).toEqual(["BG", "BS", "VQ"]);
  });

  it("ranks an exact code first, then cities, then countries", async () => {
    expect((await travel.searchAirports("dxb"))[0]?.iata).toBe("DXB");
    expect((await travel.searchAirports("dha"))[0]?.iata).toBe("DAC");
    expect((await travel.searchAirports("cox"))[0]?.iata).toBe("CXB");
    expect((await travel.searchAirports("turkiye")).map((airport) => airport.iata)).toEqual([
      "IST",
      "ASR",
    ]);
    expect(await travel.searchAirports("   ")).toEqual([]);
  });

  it("hides group fares after they expire and filters by destination and month", async () => {
    const now = dhaka("2026-10-10T10:00");
    const all = await travel.listGroupFares({ now });
    expect(all.length).toBeGreaterThan(0);
    expect(all.map((fare) => fare.departDate)).toEqual(
      [...all.map((fare) => fare.departDate)].sort(),
    );
    expect(
      (await travel.listGroupFares({ now, to: "dxb" })).every((fare) => fare.to.iata === "DXB"),
    ).toBe(true);
    expect(
      (await travel.listGroupFares({ now, month: "2026-12" })).every((fare) =>
        fare.departDate.startsWith("2026-12"),
      ),
    ).toBe(true);
    const later = await travel.listGroupFares({ now: dhaka("2026-11-01T00:00") });
    expect(later.map((fare) => fare.id)).not.toContain("gf-ek-dxb-1114");
    expect(await travel.getGroupFare("gf-ek-dxb-1114", dhaka("2026-11-01T00:00"))).toBeNull();
    expect(await travel.getGroupFare("gf-ek-dxb-1114", now)).not.toBeNull();
  });

  it("filters, sorts and paginates packages (FR-PKG-02)", async () => {
    const popular = await travel.listPackages({ limit: 50 });
    expect(popular.items[0]?.slug).toBe("maldives-island-stay");
    const cheapest = await travel.listPackages({ sort: "price-asc", limit: 50 });
    const prices = cheapest.items.map((pkg) => pkg.fromPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const honeymoon = await travel.listPackages({ category: "honeymoon", limit: 50 });
    expect(honeymoon.items.every((pkg) => pkg.categories.includes("honeymoon"))).toBe(true);
    const december = await travel.listPackages({ month: "2026-12", maxNights: 3, limit: 50 });
    expect(
      december.items.every((pkg) => pkg.months.includes("2026-12") && pkg.durationNights <= 3),
    ).toBe(true);
    const visaHelp = await travel.listPackages({ includes: ["Flights", "Visa help"], limit: 50 });
    expect(visaHelp.items.map((pkg) => pkg.slug).sort()).toEqual([
      "dubai-city-and-desert",
      "istanbul-and-cappadocia-in-a-week",
    ]);
    const page = await travel.listPackages({ limit: 4, offset: 8 });
    expect(page.items.length).toBe(page.total - 8);
    expect(page.nextOffset).toBeNull();
  });

  it("finds packages by place name without accents", async () => {
    const turkiye = await travel.listPackages({ search: "turkiye" });
    expect(turkiye.items.map((pkg) => pkg.slug)).toEqual(["istanbul-and-cappadocia-in-a-week"]);
  });

  it("returns related packages in the admin order", async () => {
    const related = await travel.listRelatedPackages("istanbul-and-cappadocia-in-a-week");
    expect(related.map((pkg) => pkg.slug)).toEqual([
      "dubai-city-and-desert",
      "bali-temples-and-beaches",
      "bangkok-and-phuket",
    ]);
  });

  it("suggests popular hotel cities when the box is empty", async () => {
    const popular = await travel.searchHotelPlaces("");
    expect(popular.every((place) => place.popular)).toBe(true);
    expect((await travel.searchHotelPlaces("coxs"))[0]?.id).toBe("city-coxs-bazar");
  });
});

describe("visa repository", () => {
  it("filters countries by region, popularity and name", async () => {
    expect(
      (await visa.listVisaCountries({ region: "europe" })).map((country) => country.slug),
    ).toEqual(["turkiye", "schengen", "united-kingdom"]);
    expect(
      (await visa.listVisaCountries({ popular: true })).map((country) => country.slug),
    ).toContain("thailand");
    expect((await visa.listVisaCountries({ search: "UAE" })).length).toBe(0);
    expect(
      (await visa.listVisaCountries({ search: "emirates" })).map((country) => country.slug),
    ).toEqual(["united-arab-emirates"]);
  });

  it("serves guides newest first and links them to countries", async () => {
    const guides = await visa.listVisaGuides();
    expect(guides[0]?.slug).toBe("thailand");
    const thailand = await visa.getVisaCountry("thailand");
    expect(thailand?.guideSlug && (await visa.getVisaGuide(thailand.guideSlug))?.countrySlug).toBe(
      "thailand",
    );
  });
});

describe("shop repository", () => {
  it("includes sub-category products when listing a parent category", async () => {
    const electronics = await shop.listProducts({ category: "electronics-and-gadgets" });
    expect(electronics.items.map((product) => product.id).sort()).toEqual([
      "prod-headphones",
      "prod-power-bank",
    ]);
    expect((await shop.listProducts({ category: "no-such-category" })).total).toBe(0);
  });

  it("filters by category attributes from variant options or spec rows", async () => {
    const bySize = await shop.listProducts({
      category: "fashion-and-lifestyle",
      attributes: [{ key: "size", label: "Size", values: ["XL"] }],
    });
    expect(bySize.items.map((product) => product.id)).toEqual(["prod-tee"]);
    const compatible = await shop.listProducts({
      category: "printers-and-supplies",
      attributes: [{ key: "cartridgeType", label: "Type", values: ["Compatible"] }],
    });
    expect(compatible.total).toBeGreaterThan(0);
    const none = await shop.listProducts({
      category: "printers-and-supplies",
      attributes: [{ key: "colour", label: "Colour", values: ["Magenta"] }],
    });
    expect(none.total).toBe(0);
  });

  it("applies rule-based and manual collections", async () => {
    expect(
      (await shop.listProducts({ collection: "under-999" })).items.map((product) => product.id),
    ).toEqual(["prod-tee"]);
    expect(
      (await shop.listProducts({ collection: "power-and-charging" })).items.map(
        (product) => product.id,
      ),
    ).toEqual(["prod-power-bank"]);
    expect((await shop.listProducts({ collection: "office-essentials" })).total).toBe(3);
  });

  it("searches titles, brands and part codes, and sorts by price", async () => {
    expect((await shop.listProducts({ search: "better day" })).total).toBe(3);
    expect(
      (await shop.listProducts({ search: "cf280a" })).items.map((product) => product.id),
    ).toEqual(["prod-bd-cf280a"]);
    const byPrice = (await shop.listProducts({ sort: "price-desc" })).items.map(productFromPrice);
    expect(byPrice).toEqual([...byPrice].sort((a, b) => b - a));
  });

  it("finds toner by printer model or by part code (FR-SHOP-05)", async () => {
    const byModel = await shop.findCompatibleProducts({ modelId: "hp-lj-pro-400-m401dn" });
    expect(byModel.map((product) => product.id)).toEqual(["prod-bd-cf280a"]);
    const byCode = await shop.findCompatibleProducts({ partCode: "crg-070h" });
    expect(byCode.map((product) => product.id)).toEqual(["prod-bd-crg070h"]);
    expect(await shop.findCompatibleProducts({ partCode: "XP-9912" })).toEqual([]);
    expect(
      (await shop.listCompatibleModels("canon")).every((model) => model.brand === "Canon"),
    ).toBe(true);
  });

  it("lists running deals with their product, ending soonest first", async () => {
    const deals = await shop.listDeals(dhaka("2026-10-10T10:00"));
    expect(deals.map((deal) => deal.id)).toEqual(["deal-headphones", "deal-pb-20k"]);
    expect(deals[0]?.product.slug).toBe("sonaro-air-wireless-over-ear-headphones");
    expect(await shop.listDeals(dhaka("2026-11-01T00:00"))).toEqual([]);
  });

  it("accepts a valid coupon in any case and rejects expired ones", async () => {
    expect((await shop.findCoupon(" welcome10 ", dhaka("2026-10-10T10:00")))?.code).toBe(
      "WELCOME10",
    );
    expect(await shop.findCoupon("FREESHIP", dhaka("2026-10-10T10:00"))).toBeNull();
    expect(await shop.findCoupon("NOPE", dhaka("2026-10-10T10:00"))).toBeNull();
  });

  it("stores an order with a fresh ORD reference and finds it only with the matching phone", async () => {
    const repo = createFixtureRepositories().shop;
    const draft = {
      items: [
        {
          productId: "p",
          variantId: "v",
          title: "Item",
          sku: "S",
          unitPrice: 100,
          quantity: 2,
          lineTotal: 200,
        },
      ],
      subtotal: 200,
      discount: 0,
      delivery: 80,
      total: 280,
      payment: { method: "cod" as const },
      paymentVerified: false,
      address: {
        name: "Rahim",
        phone: "+8801712345678",
        division: "Dhaka",
        district: "Dhaka",
        area: "Motijheel",
        street: "House 4",
      },
      pickup: false,
    };
    const first = await repo.createOrder(draft, dhaka("2026-10-10T11:00"));
    const second = await repo.createOrder(draft, dhaka("2026-10-10T11:05"));
    expect(first.reference).toBe("ORD-261010-0001");
    expect(second.reference).toBe("ORD-261010-0002");
    expect(first.status).toBe("placed");
    expect((await repo.findOrder(first.reference.toLowerCase(), "01712-345678"))?.id).toBe(
      first.id,
    );
    expect(await repo.findOrder(first.reference, "01999-000000")).toBeNull();
    expect(await repo.findOrder("ORD-000000-0000", "01712-345678")).toBeNull();
  });

  it("returns the category tree parents first", async () => {
    const categories = await shop.listCategories();
    expect(categories.slice(0, 6).every((category) => category.level === 1)).toBe(true);
  });
});

describe("leads repository", () => {
  const contact = { name: "Sample Customer", phone: "+8801000000101" };
  const flight = {
    module: "flights",
    search: {
      tripType: "one-way",
      legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
      travellers: { adults: 1, childAges: [], infants: 0 },
      cabin: "economy",
    },
  };
  const submission = (payload: unknown): LeadCreateInput =>
    LeadCreateInputSchema.parse({ contact, payload, consent: true });

  it("issues module-prefixed, per-day sequential references in Dhaka time", async () => {
    const repo = createFixtureRepositories().leads;
    const now = new Date("2026-10-07T21:30:00Z"); // 03:30 on 8 Oct in Dhaka
    const first = await repo.createLead(submission(flight), now);
    const second = await repo.createLead(submission(flight), now);
    expect(first.reference).toBe("FLT-261008-0001");
    expect(second.reference).toBe("FLT-261008-0002");
    expect(first.createdAt).toBe("2026-10-08T03:30:00+06:00");
    const visaLead = await repo.createLead(
      submission({
        module: "visa",
        countrySlug: "thailand",
        countryName: "Thailand",
        visaType: "tourist",
        applicants: 1,
        travelDate: "2026-11-20",
      }),
      now,
    );
    expect(parseReference(visaLead.reference)).toEqual({
      prefix: "VSA",
      date: "2026-10-08",
      sequence: 1,
    });
  });

  it("re-validates what it is given and rejects a submission without consent", async () => {
    const repo = createFixtureRepositories().leads;
    const withoutConsent = { ...submission(flight), consent: false } as unknown as LeadCreateInput;
    await expect(repo.createLead(withoutConsent, new Date())).rejects.toThrow();
  });

  it("logs searches next to the Sample ones, newest first (FR-SRCH-10)", async () => {
    const repo = createFixtureRepositories().leads;
    const before = await repo.listSearchLogs();
    await repo.logSearch(
      {
        module: "flights",
        summary: "DAC → CXB · 12 Dec · 2 travellers",
        params: { from: "DAC", to: "CXB", depart: "2026-12-12", adults: 2 },
        device: "phone",
        source: "home",
      },
      new Date("2026-10-10T05:00:00Z"),
    );
    const after = await repo.listSearchLogs();
    expect(after.total).toBe(before.total + 1);
    expect(after.items[0]).toMatchObject({
      module: "flights",
      sample: false,
      createdAt: "2026-10-10T11:00:00+06:00",
    });
    const hotels = await repo.listSearchLogs({ module: "hotels" });
    expect(hotels.items.every((log) => log.module === "hotels")).toBe(true);
  });

  it("refuses a search log that breaks the contract", async () => {
    const repo = createFixtureRepositories().leads;
    const bad = { module: "flights", summary: "", params: {}, device: "watch", source: "home" };
    await expect(
      repo.logSearch(bad as unknown as Parameters<typeof repo.logSearch>[0], new Date()),
    ).rejects.toThrow();
  });
});

describe("search settings", () => {
  it("starts From at Dhaka and offers known popular airports", async () => {
    const search = await settings.getSearchSettings();
    expect(search.defaultOrigin).toBe("DAC");
    expect(search.popularFlights.length).toBeGreaterThan(0);
    for (const code of search.popularFlights) {
      expect(await travel.getAirport(code)).not.toBeNull();
    }
  });
});
