import { NextResponse } from "next/server";
import { adminStream } from "@/lib/admin/adminApi";

/**
 * The admin's real-time stream (issue 243): the API's Server-Sent Events passed straight through. `no-transform` keeps
 * compression from holding events back and X-Accel-Buffering tells nginx not to buffer them. When it fails the admin
 * keeps polling /api/inbox every 30 s, so nothing is lost, only later.
 */
export async function GET(request: Request) {
  const upstream = await adminStream("/admin/events", request.signal).catch(() => null);
  if (!upstream) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (upstream.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!upstream.ok || !upstream.body)
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
