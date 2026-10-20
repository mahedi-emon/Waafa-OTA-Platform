import { NextResponse } from "next/server";
import { MediaIdSchema, MediaUsageSchema } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

/** Every record and setting that shows a library file (D0 R3), checked here on the server. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/media/[id]/usage">,
) {
  const { id } = await params;
  if (!MediaIdSchema.safeParse(id).success)
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(`/admin/media/${id}/usage`);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (response.status === 404) return NextResponse.json({ error: "unknown" }, { status: 404 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  const usage = MediaUsageSchema.safeParse(await response.json());
  if (!usage.success) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(usage.data, { headers: { "cache-control": "no-store" } });
}
