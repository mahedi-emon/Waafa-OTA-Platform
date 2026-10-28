import { describe, expect, it } from "vitest";
import { summarizeLead } from "../helpers/leadSummary";
import { HotelSchema } from "./travel";

describe("curated hotels (issue 249)", () => {
  const image = {
    src: "/media/photos/hotel-room.jpg",
    alt: "Hotel room",
    width: 1600,
    height: 1067,
  };
  const hotel = {
    id: "hotel-sample-coxs",
    slug: "sample-beach-resort",
    name: "Sample Beach Resort",
    city: "Cox’s Bazar",
    country: "Bangladesh",
    stars: 4,
    summary: "A short walk to the beach.",
    description: ["A sample listing."],
    cover: image,
    amenities: ["wifi", "pool"],
    rooms: [
      { id: "deluxe", name: "Deluxe double", beds: "1 king bed", sleeps: 2, fromPrice: 7500 },
    ],
    status: "published",
    sample: true,
  };

  it("needs a room type, refuses repeated room ids and unknown amenities", () => {
    expect(HotelSchema.safeParse(hotel).success).toBe(true);
    expect(HotelSchema.safeParse({ ...hotel, rooms: [] }).success).toBe(false);
    const twice = HotelSchema.safeParse({ ...hotel, rooms: [hotel.rooms[0], hotel.rooms[0]] });
    expect(twice.error?.issues[0]?.message).toBe("Room types need different ids");
    expect(HotelSchema.safeParse({ ...hotel, amenities: ["casino"] }).success).toBe(false);
    expect(HotelSchema.safeParse({ ...hotel, stars: 6 }).success).toBe(false);
  });

  it("names the room type in a hotel request's summary", () => {
    const digest = summarizeLead({
      module: "hotels",
      search: {
        placeId: "city-coxs-bazar",
        placeLabel: "Sample Beach Resort, Cox’s Bazar",
        checkIn: "2026-11-14",
        checkOut: "2026-11-16",
        rooms: [{ adults: 2, childAges: [] }],
        nationality: "BD",
      },
      starPreference: "any",
      budgetBand: "any",
      meals: "any",
      seaView: false,
      freeCancellation: false,
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomType: "Family suite",
    });
    expect(digest.summary).toMatch(/^Sample Beach Resort, Cox’s Bazar · .* · Family suite$/);
  });
});
