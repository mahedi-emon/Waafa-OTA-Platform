import type { AddressView } from "@waafa/shared";
import type { CheckoutValues } from "@/lib/shop/checkoutForm";

export type AccountSummary = {
  signedIn: boolean;
  contact?: { name: string; email: string; phone: string | null };
  address?: AddressView | null;
};

type Field =
  "name" | "email" | "phoneCountry" | "phone" | "division" | "district" | "area" | "street";

/** "+8801712345678" → "01712345678" for the Bangladesh box; other countries are left for the customer to type. */
function bdNational(e164: string | null | undefined): string | null {
  return e164?.startsWith("+880") ? `0${e164.slice(4)}` : null;
}

/**
 * The checkout values a signed-in customer's account gives (issue 278): the default address first, then the account's
 * name, email and phone. Only fields that are still empty are returned, so nothing the customer typed is replaced.
 */
export function checkoutPrefill(
  summary: AccountSummary,
  current: Pick<CheckoutValues, Field>,
): Partial<Pick<CheckoutValues, Field>> {
  if (!summary.signedIn) return {};
  const out: Partial<Pick<CheckoutValues, Field>> = {};
  const fill = (field: Exclude<Field, "phoneCountry">, value: string | null | undefined) => {
    if (value && !current[field]) out[field] = value;
  };
  const address = summary.address ?? null;
  fill("name", address?.name ?? summary.contact?.name);
  fill("email", summary.contact?.email);
  const phone = bdNational(address?.phone) ?? bdNational(summary.contact?.phone);
  if (phone && !current.phone) {
    out.phoneCountry = "BD";
    out.phone = phone;
  }
  if (address) {
    fill("division", address.division);
    fill("district", address.district);
    fill("area", address.area);
    fill("street", address.street);
  }
  return out;
}
