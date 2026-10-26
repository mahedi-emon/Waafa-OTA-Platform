import { NextResponse } from "next/server";
import { isStorageKey } from "@waafa/shared";
import { customerFileLink, fetchSignedFile } from "@/lib/admin/customerFiles";

const PASSED_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
  "cache-control",
  "x-content-type-options",
  "content-security-policy",
  "referrer-policy",
];

const page = (status: number, message: string) =>
  new NextResponse(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });

/**
 * Opens a customer file for staff (issue 232, FR-VISA-05): the session asks the API for a ten-minute signed link to the
 * file (the API checks the staff member may see the record that holds it and audits the link), then the file streams
 * back through that link (the API audits the download). The browser never gets a lasting address for the file.
 * Outside the proxy, like the media uploads; the session cookie authorises the call.
 */
export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  // Only from the admin itself (or typed in the address bar): a link on another site can't make staff open files.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    return page(403, "Open files from the admin.");
  const { key } = await context.params;
  if (!isStorageKey(key)) return page(404, "File not found.");
  const link = await customerFileLink(key);
  if (!link.ok) {
    if (link.problem.status === 401) {
      return NextResponse.redirect(new URL("/secure-admin-control/sign-in", request.url), 303);
    }
    if (link.problem.code === "infected") {
      return page(409, "This file failed the malware scan and is quarantined.");
    }
    if (link.problem.code === "scanning") {
      return page(409, "This file is still being checked for viruses. Try again in a minute.");
    }
    return page(link.problem.status === 403 ? 403 : 404, link.problem.detail ?? "File not found.");
  }
  const file = await fetchSignedFile(link.data.token);
  if (!file.ok || !file.body) return page(404, "The file could not be opened. Try again.");
  const headers = new Headers();
  for (const name of PASSED_HEADERS) {
    const value = file.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-robots-tag", "noindex, nofollow");
  return new NextResponse(file.body, { status: 200, headers });
}
