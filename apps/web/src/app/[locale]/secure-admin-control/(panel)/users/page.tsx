import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RoleSchema, type Role } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import type { StaffRow } from "@/lib/admin/types";
import { StaffManager } from "./_components/StaffManager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.users");
  return { title: t("metaTitle") };
}

async function Users() {
  const [staff, t, tc, tf] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.users"),
    getTranslations("Admin.common"),
    getTranslations("Admin.forbidden"),
  ]);
  if (!hasRole(staff, "super-admin")) {
    return <AdminPageHeader title={tf("title")} lead={tf("body")} />;
  }
  const rows = await adminGet<StaffRow[]>("/admin/users");
  const roleNames = Object.fromEntries(
    RoleSchema.options.map((role) => [role, t(`roleNames.${role}`)]),
  ) as Record<Role, string>;
  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StaffManager
        rows={rows}
        selfId={staff.id}
        roleNames={roleNames}
        strings={{
          add: t("add"),
          name: t("name"),
          email: t("email"),
          roles: t("roles"),
          password: t("password"),
          passwordHint: t("passwordHint"),
          active: t("active"),
          deactivated: t("deactivated"),
          locked: t("locked"),
          invited: t("invited"),
          reasons: {
            active: t("reasons.active"),
            invited: t("reasons.invited"),
            deactivated: t("reasons.deactivated"),
            locked: t("reasons.locked"),
          },
          lastLogin: t("lastLogin"),
          never: t("never"),
          deactivate: t("deactivate"),
          activate: t("activate"),
          resetPassword: t("resetPassword"),
          newPassword: t("newPassword"),
          saveRoles: t("saveRoles"),
          created: t("created"),
          updated: t("updated"),
          passwordReset: t("passwordReset"),
          cancel: tc("cancel"),
          save: tc("save"),
          failed: tc("unavailable"),
        }}
      />
    </>
  );
}

/** Users and roles (AdminUsers board), Super Admin only. */
export default function UsersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Users />
    </Suspense>
  );
}
