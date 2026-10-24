import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getStaffSession } from "@/lib/admin/adminApi";
import { previewHref, previewPath } from "@/lib/admin/preview";
import { PREVIEW_HINT_COOKIE } from "@/lib/staffHint";

/**
 * Preview of unpublished changes (D0 R7, D219): for signed-in staff, turns on Next.js draft mode and opens the page,
 * where drafts and scheduled records show as Live under the preview banner. Signed out, it asks for the sign-in
 * first and comes back here.
 */
export async function GET(request: NextRequest) {
  const path = previewPath(request.nextUrl.searchParams.get("path"));
  const staff = await getStaffSession();
  if (!staff) {
    redirect(`/secure-admin-control/sign-in?next=${encodeURIComponent(previewHref(path))}`);
  }
  (await draftMode()).enable();
  // A readable hint for the staff tools on the page; it lives as long as the draft-mode cookie (browser session).
  (await cookies()).set(PREVIEW_HINT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  redirect(path);
}
