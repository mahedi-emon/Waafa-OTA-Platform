import { NextResponse, type NextRequest } from "next/server";
import { searchHotelPlaces } from "@/lib/data/travel";

/** City and hotel autocomplete for the hotel tab (FR-SRCH-03). An empty query returns the popular places. */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 40);
  const items = await searchHotelPlaces(query, 12);
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" } },
  );
}
