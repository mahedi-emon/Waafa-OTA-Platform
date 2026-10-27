import { describe, expect, it } from "vitest";
import { checkoutPrefill, type AccountSummary } from "./checkoutPrefill";

const EMPTY = {
  name: "",
  email: "",
  phoneCountry: "BD",
  phone: "",
  division: "",
  district: "",
  area: "",
  street: "",
};

const SUMMARY: AccountSummary = {
  signedIn: true,
  contact: { name: "Sample Customer", email: "sample@example.com", phone: "+8801712345670" },
  address: {
    id: "a1",
    label: "Home",
    name: "Sample Home",
    phone: "+8801812345678",
    division: "Dhaka",
    district: "Dhaka",
    area: "Gulshan",
    street: "House 1, Road 2",
    isDefault: true,
  },
};

describe("checkoutPrefill (issue 278)", () => {
  it("gives nothing for a visitor who is not signed in", () => {
    expect(checkoutPrefill({ signedIn: false }, EMPTY)).toEqual({});
  });

  it("fills empty fields from the default address, then the account", () => {
    expect(checkoutPrefill(SUMMARY, EMPTY)).toEqual({
      name: "Sample Home",
      email: "sample@example.com",
      phoneCountry: "BD",
      phone: "01812345678",
      division: "Dhaka",
      district: "Dhaka",
      area: "Gulshan",
      street: "House 1, Road 2",
    });
  });

  it("uses the account's name and phone when there is no address", () => {
    expect(checkoutPrefill({ ...SUMMARY, address: null }, EMPTY)).toEqual({
      name: "Sample Customer",
      email: "sample@example.com",
      phoneCountry: "BD",
      phone: "01712345670",
    });
  });

  it("keeps what the customer already typed", () => {
    const out = checkoutPrefill(SUMMARY, { ...EMPTY, name: "Typed", phone: "01999999999" });
    expect(out.name).toBeUndefined();
    expect(out.phone).toBeUndefined();
    expect(out.phoneCountry).toBeUndefined();
    expect(out.street).toBe("House 1, Road 2");
  });

  it("leaves a phone from another country for the customer to type", () => {
    const out = checkoutPrefill(
      { signedIn: true, contact: { name: "A B", email: "a@example.com", phone: "+447700900123" } },
      EMPTY,
    );
    expect(out.phone).toBeUndefined();
  });
});
