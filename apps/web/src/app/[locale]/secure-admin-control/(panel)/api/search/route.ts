import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

/** Ctrl K record search for the signed-in person (leads, orders, customers, records they can edit). */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return NextResponse.json({ hits: [] });
  const response = await adminDownload("/admin/search", { q: query });
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(response.body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
