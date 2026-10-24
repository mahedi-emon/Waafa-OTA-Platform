import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { canEditContentKey, hasAnyRole } from "@waafa/shared";
import { routing } from "@/i18n/routing";
import { getStaffSession } from "@/lib/admin/adminApi";
import { editTargetFor } from "@/lib/admin/editLinks";
import { HOME_SECTIONS } from "@/lib/admin/homeSections";
import type { StaffToolsData } from "@/components/staff/staffToolsTypes";

const NO_STORE = { "cache-control": "no-store" };

/**
 * What the public site's staff tools need on one page (D0 R7): where Edit this page goes for this person, whether
 * they may edit the home sections, and the words. The public pages carry none of it; only a signed-in browser asks.
 */
export async function GET(request: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "signed-out" }, { status: 401, headers: NO_STORE });
  const locale = routing.defaultLocale;
  const [t, tSections] = await Promise.all([
    getTranslations({ locale, namespace: "Admin.staffTools" }),
    getTranslations({ locale, namespace: "Admin.website.sections" }),
  ]);
  const target = editTargetFor(request.nextUrl.searchParams.get("path") ?? "/", routing.locales);
  const mayEdit =
    target &&
    ("key" in target
      ? canEditContentKey(staff.roles, target.key)
      : hasAnyRole(staff.roles, ...target.roles));
  const data: StaffToolsData = {
    edit: mayEdit ? target.href : null,
    sections: canEditContentKey(staff.roles, "homeSections")
      ? Object.fromEntries(
          Object.keys(HOME_SECTIONS).map((key) => [
            key,
            t("editSection", { name: tSections(`${key}.name` as "hero.name") }),
          ]),
        )
      : {},
    labels: {
      region: t("region"),
      edit: t("edit"),
      admin: t("admin"),
      more: t("more"),
      editSections: t("editSections"),
      exitPreview: t("exitPreview"),
      hide: t("hide"),
    },
  };
  return NextResponse.json(data, { headers: NO_STORE });
}
