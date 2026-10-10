import { describe, expect, it } from "vitest";
import { OrderCreateInputSchema } from "@waafa/shared";
import { buildOrderInput, checkoutSchema, type CheckoutValues } from "./checkoutForm";
import type { CartLine } from "./cart";

const valid: CheckoutValues = {
  name: "Rahim Uddin",
  phoneCountry: "BD",
  phone: "01712-345678",
  email: "",
  vat: false,
  company: "",
  bin: "",
  deliveryMode: "courier",
  division: "Dhaka",
  district: "Dhaka",
  area: "Motijheel",
  street: "House 4, Road 2",
  note: "",
  payment: "cod",
  transactionId: "",
};

const lines: CartLine[] = [
  {
    productId: "p1",
    variantId: "v1",
    slug: "p1",
    title: "Item",
    variantLabel: "",
    sku: "S1",
    price: 500,
    qty: 2,
    maxQty: 5,
  },
];

const messages = (values: CheckoutValues) => {
  const result = checkoutSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("checkoutSchema", () => {
  it("accepts a complete cash-on-delivery order", () => {
    expect(messages(valid)).toEqual([]);
  });

  it("requires a valid phone number and the delivery address for couriers", () => {
    expect(messages({ ...valid, phone: "123" })).toContain("phoneInvalid");
    expect(messages({ ...valid, district: "", area: "", street: "" })).toEqual(
      expect.arrayContaining(["districtRequired", "areaRequired", "streetRequired"]),
    );
  });

  it("does not ask for an address on office pick-up", () => {
    expect(
      messages({
        ...valid,
        deliveryMode: "pickup",
        division: "",
        district: "",
        area: "",
        street: "",
      }),
    ).toEqual([]);
  });

  it("asks for company and BIN only when a VAT invoice is wanted", () => {
    expect(messages({ ...valid, vat: true })).toEqual(
      expect.arrayContaining(["companyRequired", "binInvalid"]),
    );
    expect(messages({ ...valid, vat: true, company: "Rahman Traders", bin: "123456789" })).toEqual(
      [],
    );
  });

  it("asks for the transaction ID on a transfer", () => {
    expect(messages({ ...valid, payment: "acc-bkash" })).toContain("transactionRequired");
    expect(messages({ ...valid, payment: "acc-bkash", transactionId: "8N7A6B5C4D" })).toEqual([]);
  });
});

describe("buildOrderInput", () => {
  it("makes a payload the shared contract accepts, without any price", () => {
    const input = buildOrderInput(valid, lines, "WELCOME10", null);
    expect(OrderCreateInputSchema.safeParse(input).success).toBe(true);
    expect(input.lines).toEqual([{ variantId: "v1", quantity: 2 }]);
    expect(input.address.phone).toBe("+8801712345678");
    expect(JSON.stringify(input)).not.toContain("price");
  });

  it("sends the office as the address for pick-up and the proof metadata for a transfer", () => {
    const input = buildOrderInput(
      { ...valid, deliveryMode: "pickup", payment: "acc-bkash", transactionId: "8N7A6B5C4D" },
      lines,
      "",
      { fileName: "slip.png", mimeType: "image/png", sizeBytes: 1200 },
    );
    expect(OrderCreateInputSchema.safeParse(input).success).toBe(true);
    expect(input.pickup).toBe(true);
    expect(input.address.area).toBe("Motijheel");
    expect(input.payment).toMatchObject({ method: "offline", accountId: "acc-bkash" });
  });
});
