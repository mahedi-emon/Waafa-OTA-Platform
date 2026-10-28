import { NextResponse } from "next/server";
import { quotePdf } from "@/lib/data/quotes";
import { clientKey } from "@/lib/rateLimit";

/** The customer's quote PDF by the signed link (issue 298); never cached, never indexed. */
export async function GET(request: Request, { params }: RouteContext<"/api/quotes/[token]/pdf">) {
  const { token } = await params;
  const response = await quotePdf(token, { clientIp: clientKey(request.headers) }).catch(
    () => null,
  );
  if (!response) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return new Response(response.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": response.headers.get("content-disposition") ?? "inline",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex",
    },
  });
}
