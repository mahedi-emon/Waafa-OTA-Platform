import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

/** What waits for the signed-in person (sidebar badges, the bell), polled every 30 s by the admin frame (D0 R1). */
export async function GET() {
  const response = await adminDownload("/admin/inbox");
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(response.body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
