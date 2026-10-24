import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { previewPath } from "@/lib/admin/preview";
import { PREVIEW_HINT_COOKIE } from "@/lib/staffHint";

/** Ends Preview of unpublished changes (D0 R7) and stays on the page, now showing only what is Live. */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_HINT_COOKIE);
  redirect(previewPath(request.nextUrl.searchParams.get("path")));
}
