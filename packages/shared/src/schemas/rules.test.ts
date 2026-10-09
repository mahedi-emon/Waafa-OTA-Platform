import { describe, expect, it } from "vitest";
import { LeadCreateInputSchema, LeadSchema } from "./leads";
import { FlightSearchSchema, HotelSearchSchema, TravellersSchema } from "./search";
import { ModuleModeSchema } from "./settings";
import { OrderSchema, ProductSchema } from "./shop";

const oneWay = {
  tripType: "one-way" as const,
  legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
  travellers: { adults: 1, childAges: [], infants: 0 },
  cabin: "economy" as const,
};

describe("search rules (FR-SRCH-02, FR-SRCH-08)", () => {
  it("accepts a valid one-way search and fills defaults", () => {
    const parsed = FlightSearchSchema.parse(oneWay);
    expect(parsed.directOnly).toBe(false);
    expect(parsed.fareType).toBe("regular");
  });

  it("rejects the same airport for From and To", () => {
    const result = FlightSearchSchema.safeParse({
      ...oneWay,
      legs: [{ from: "DAC", to: "DAC", date: "2026-11-14" }],
    });
    expect(result.success).toBe(false);
  });

  it("needs a return on or after departure for round trips", () => {
    expect(FlightSearchSchema.safeParse({ ...oneWay, tripType: "round-trip" }).success).toBe(false);
    expect(
      FlightSearchSchema.safeParse({ ...oneWay, tripType: "round-trip", returnDate: "2026-11-10" })
        .success,
    ).toBe(false);
    expect(
      FlightSearchSchema.safeParse({ ...oneWay, tripType: "round-trip", returnDate: "2026-11-14" })
        .success,
    ).toBe(true);
  });

  it("caps travellers at nine and infants at the number of adults", () => {
    expect(
      TravellersSchema.safeParse({ adults: 5, childAges: [4, 6, 8, 10], infants: 1 }).success,
    ).toBe(false);
    expect(TravellersSchema.safeParse({ adults: 1, childAges: [], infants: 2 }).success).toBe(
      false,
    );
    expect(TravellersSchema.safeParse({ adults: 2, childAges: [5], infants: 2 }).success).toBe(
      true,
    );
  });

  it("allows up to five ordered legs on multi-city", () => {
    const legs = [
      { from: "DAC", to: "DXB", date: "2026-11-01" },
      { from: "DXB", to: "IST", date: "2026-11-05" },
      { from: "IST", to: "DAC", date: "2026-11-03" },
    ];
    expect(FlightSearchSchema.safeParse({ ...oneWay, tripType: "multi-city", legs }).success).toBe(
      false,
    );
    const ordered = legs.map((leg, i) => ({ ...leg, date: `2026-11-0${i + 1}` }));
    expect(
      FlightSearchSchema.safeParse({ ...oneWay, tripType: "multi-city", legs: ordered }).success,
    ).toBe(true);
  });

  it("limits hotel stays to 30 nights and needs check-out after check-in", () => {
    const base = {
      placeId: "cox",
      placeLabel: "Cox’s Bazar",
      rooms: [{ adults: 2, childAges: [] }],
    };
    expect(
      HotelSearchSchema.safeParse({ ...base, checkIn: "2026-12-01", checkOut: "2026-12-01" })
        .success,
    ).toBe(false);
    expect(
      HotelSearchSchema.safeParse({ ...base, checkIn: "2026-12-01", checkOut: "2027-01-05" })
        .success,
    ).toBe(false);
    expect(
      HotelSearchSchema.parse({ ...base, checkIn: "2026-12-01", checkOut: "2026-12-04" })
        .nationality,
    ).toBe("BD");
  });
});

describe("lead rules (FR-FLT-02, FR-ADM-LEAD)", () => {
  const contact = { name: "Sample Customer", phone: "+8801000000101" };
  const payload = { module: "flights" as const, search: oneWay };

  it("needs consent to be contacted", () => {
    expect(LeadCreateInputSchema.safeParse({ contact, payload }).success).toBe(false);
    expect(LeadCreateInputSchema.safeParse({ contact, payload, consent: true }).success).toBe(true);
  });

  it("rejects unknown fields", () => {
    expect(
      LeadCreateInputSchema.safeParse({ contact, payload, consent: true, admin: true }).success,
    ).toBe(false);
  });

  it("requires an amount when booked and a reason when lost", () => {
    const lead = {
      id: "lead-1",
      reference: "FLT-261008-0042",
      module: "flights",
      priority: "normal",
      contact,
      payload,
      source: { channel: "web" },
      summary: "DAC → DXB",
      createdAt: "2026-10-08T10:00:00+06:00",
      sample: true,
    };
    expect(LeadSchema.safeParse({ ...lead, status: "booked" }).success).toBe(false);
    expect(LeadSchema.safeParse({ ...lead, status: "booked", amount: 58500 }).success).toBe(true);
    expect(LeadSchema.safeParse({ ...lead, status: "lost" }).success).toBe(false);
    expect(
      LeadSchema.safeParse({ ...lead, status: "lost", reason: "Booked elsewhere" }).success,
    ).toBe(true);
  });
});

describe("Golden Switch (FR-GS-03)", () => {
  it("never lets a locked module be Live", () => {
    const base = { module: "flights", updatedAt: "2026-10-09T09:00:00+06:00" };
    expect(ModuleModeSchema.safeParse({ ...base, mode: "live", liveLocked: true }).success).toBe(
      false,
    );
    expect(
      ModuleModeSchema.safeParse({
        ...base,
        mode: "manual",
        liveLocked: true,
        lockReason: "No provider",
      }).success,
    ).toBe(true);
  });
});

describe("catalogue and order integrity", () => {
  const product = {
    id: "p1",
    slug: "tee",
    title: "Tee",
    shortTitle: "Tee",
    brandId: "b1",
    categoryId: "c1",
    highlights: [],
    description: ["Soft cotton."],
    specs: [],
    warranty: { short: "Exchange", returnsShort: "7 days" },
    images: [{ src: "/x.jpg", alt: "Tee" }],
    options: [
      { key: "size", label: "Size", display: "size", values: [{ value: "M" }, { value: "L" }] },
    ],
    variants: [
      { id: "v1", sku: "T-M", options: { size: "M" }, price: 650, mrp: 850, stock: 4 },
      { id: "v2", sku: "T-L", options: { size: "L" }, price: 650, stock: 0 },
    ],
    defaultVariantId: "v1",
    popularity: 1,
    createdAt: "2026-10-01T10:00:00+06:00",
    status: "published",
    sample: true,
  };

  it("accepts a consistent product", () => {
    expect(ProductSchema.safeParse(product).success).toBe(true);
  });

  it("rejects a default variant that does not exist, duplicate SKUs and MRP under price", () => {
    expect(ProductSchema.safeParse({ ...product, defaultVariantId: "nope" }).success).toBe(false);
    expect(
      ProductSchema.safeParse({
        ...product,
        variants: [product.variants[0], { ...product.variants[1], sku: "T-M" }],
      }).success,
    ).toBe(false);
    expect(
      ProductSchema.safeParse({
        ...product,
        variants: [{ ...product.variants[0], mrp: 500 }, product.variants[1]],
      }).success,
    ).toBe(false);
  });

  it("requires order totals to add up", () => {
    const order = {
      id: "o1",
      reference: "ORD-261008-0001",
      items: [
        {
          productId: "p1",
          variantId: "v1",
          title: "Tee",
          sku: "T-M",
          unitPrice: 650,
          quantity: 2,
          lineTotal: 1300,
        },
      ],
      subtotal: 1300,
      discount: 100,
      delivery: 60,
      total: 1260,
      payment: { method: "cod" },
      address: {
        name: "Sample Customer",
        phone: "+8801000000101",
        division: "Dhaka",
        district: "Dhaka",
        area: "Motijheel",
        street: "Road 1, House 2",
      },
      status: "placed",
      history: [{ status: "placed", at: "2026-10-08T10:00:00+06:00" }],
      createdAt: "2026-10-08T10:00:00+06:00",
      sample: true,
    };
    expect(OrderSchema.safeParse(order).success).toBe(true);
    expect(OrderSchema.safeParse({ ...order, total: 1300 }).success).toBe(false);
  });
});
