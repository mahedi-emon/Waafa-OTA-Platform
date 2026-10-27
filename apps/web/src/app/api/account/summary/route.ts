import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readAccount } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";

/**
 * What a static page needs about the signed-in customer after hydration (issue 278): the wishlist for Save buttons,
 * and the name, email, phone and default address that checkout fills in. Signed out answers `signedIn: false`; never
 * cached.
 */
export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const account = token ? await readAccount(token) : null;
  const headers = { "Cache-Control": "private, no-store" };
  if (!account) return NextResponse.json({ signedIn: false, wishlist: [] }, { headers });
  const address = account.addresses.find((item) => item.isDefault) ?? null;
  return NextResponse.json(
    {
      signedIn: true,
      wishlist: account.wishlist,
      contact: {
        name: account.customer.name,
        email: account.customer.email,
        phone: account.customer.phone,
      },
      address,
    },
    { headers },
  );
}
