import { z } from "zod";
import type { OrderCreateInput } from "@waafa/shared";
import { isPhoneCountry, toE164 } from "@/lib/leads/phone";
import type { CartLine } from "./cart";

/*
 * Checkout form (FR-SHOP-07): contact, delivery address (or office pick-up), payment (cash on delivery or a
 * transfer with its transaction ID) and an optional VAT invoice. Messages are next-intl keys under
 * "Checkout.errors"; the server validates again with OrderCreateInputSchema and prices the order itself.
 */

export const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
] as const;

export const COD = "cod";

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
    phoneCountry: z.string(),
    phone: z.string().trim().min(1, "phoneInvalid"),
    email: z.union([z.literal(""), z.string().trim().pipe(z.email("emailInvalid"))]),
    vat: z.boolean(),
    company: z.string().trim().max(100),
    bin: z.string().trim(),
    deliveryMode: z.enum(["courier", "pickup"]),
    division: z.string(),
    district: z.string().trim().max(40),
    area: z.string().trim().max(60),
    street: z.string().trim().max(160),
    note: z.string().trim().max(300),
    /** "cod" or the id of an offline account. */
    payment: z.string().min(1, "paymentRequired"),
    transactionId: z.string().trim().max(40),
  })
  .superRefine((values, ctx) => {
    const issue = (path: keyof typeof values, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (!isPhoneCountry(values.phoneCountry) || !toE164(values.phone, values.phoneCountry)) {
      issue("phone", "phoneInvalid");
    }
    if (values.vat) {
      if (values.company.length < 2) issue("company", "companyRequired");
      if (!/^\d{9,13}$/.test(values.bin)) issue("bin", "binInvalid");
    }
    if (values.deliveryMode === "courier") {
      if (!values.division) issue("division", "divisionRequired");
      if (values.district.length < 2) issue("district", "districtRequired");
      if (values.area.length < 2) issue("area", "areaRequired");
      if (values.street.length < 3) issue("street", "streetRequired");
    }
    if (values.payment !== COD && values.payment !== "" && values.transactionId.length < 4) {
      issue("transactionId", "transactionRequired");
    }
  });

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const PICKUP_ADDRESS = {
  division: "Dhaka",
  district: "Dhaka",
  area: "Motijheel",
  street: "Office pick-up",
} as const;

export type ProofFile = {
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
};

/** The shared order contract from the form: ids and quantities only, never prices. */
export function buildOrderInput(
  values: CheckoutValues,
  lines: readonly CartLine[],
  couponCode: string,
  proof: ProofFile | null,
): OrderCreateInput {
  const phone = isPhoneCountry(values.phoneCountry)
    ? toE164(values.phone, values.phoneCountry)
    : null;
  const pickup = values.deliveryMode === "pickup";
  return {
    lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.qty })),
    ...(couponCode ? { couponCode } : {}),
    pickup,
    address: {
      name: values.name.trim(),
      phone: phone ?? "",
      ...(values.email ? { email: values.email.trim() } : {}),
      ...(pickup
        ? PICKUP_ADDRESS
        : {
            division: values.division,
            district: values.district.trim(),
            area: values.area.trim(),
            street: values.street.trim(),
          }),
      ...(values.note ? { note: values.note.trim() } : {}),
    },
    ...(values.vat
      ? { invoice: { companyName: values.company.trim(), bin: values.bin.trim() } }
      : {}),
    payment:
      values.payment === COD
        ? { method: "cod" }
        : {
            method: "offline",
            accountId: values.payment,
            transactionId: values.transactionId.trim(),
            ...(proof ? { proof: { kind: "payment-proof", ...proof } } : {}),
          },
  };
}
