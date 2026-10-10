import { NextResponse, type NextRequest } from "next/server";
import { searchAirports } from "@/lib/data/travel";

/**
 * Airport autocomplete for the search card (FR-SRCH-06). The pinned list ships with the page; typed queries
 * come here, so the full airport dataset (Phase B) never lands in the browser bundle.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 40);
  const items = query ? await searchAirports(query, 12) : [];
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" } },
  );
}
