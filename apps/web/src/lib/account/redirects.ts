import { NextResponse } from "next/server";

/**
 * A 303 to a path on this site (issue 138). The Location stays relative, so the browser stays on the address it is
 * on (the live domain, or localhost in a local run) instead of the address baked into the build.
 */
export function seeOther(path: string): NextResponse {
  return new NextResponse(null, {
    status: 303,
    headers: { location: path, "cache-control": "no-store" },
  });
}

/**
 * A form post from this site (issue 138): the browser's Origin must name the host it posted to, or, without an Origin,
 * Fetch Metadata must say same-origin. The session cookie is SameSite=Lax as well, so a cross-site post carries none.
 */
export function isSameOrigin(request: Request): boolean {
  // nginx passes the visitor's Host through unchanged.
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    try {
      return Boolean(host) && new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const site = request.headers.get("sec-fetch-site");
  return site === null || site === "same-origin";
}
