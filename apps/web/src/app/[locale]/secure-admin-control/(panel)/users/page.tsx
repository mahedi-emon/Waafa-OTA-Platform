import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  RoleSchema,
  StaffLoginResultSchema,
  twoStepRequired,
  type Role,
  type StaffLoginEvent,
  type StaffLoginResult,
} from "@waafa/shared";
import { staffStatus } from "@waafa/shared/workflow/derived";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { LoginHistory } from "@/components/admin/twoStep/LoginHistory";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, initialsOf, pageParam } from "@/lib/admin/format";
import type { StaffRow } from "@/lib/admin/types";
import { StaffAddForm } from "./_components/StaffAddForm";
import { StaffRowActions } from "./_components/StaffRowActions";
import { PermissionMatrix } from "@/components/admin/settings/PermissionMatrix";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.users");
  return { title: t("metaTitle") };
}

const STATES = ["active", "invited", "locked", "deactivated"] as const;
const SORTS = ["name.asc", "name.desc", "login.asc", "login.desc"] as const;
const PATH = "/secure-admin-control/users";
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** The staff list is small and comes whole, so the page searches, filters, sorts and pages it here (D0 R5). */
function pageOfStaff(
  rows: StaffRow[],
  search: Record<string, string | string[] | undefined>,
): { items: StaffRow[]; total: number; page: number; pageSize: number } {
  const needle = one(search.q)?.trim().toLowerCase() ?? "";
  const state = STATES.find((item) => item === one(search.state));
  const sort = sortOf(search.sort, SORTS);
  let items = rows.filter(
    (row) =>
      (!needle || `${row.name} ${row.email}`.toLowerCase().includes(needle)) &&
      (!state || staffStatus(row) === state),
  );
  if (sort) {
    const [field, dir] = sort.split(".") as ["name" | "login", "asc" | "desc"];
    const sign = dir === "asc" ? 1 : -1;
    const login = (row: StaffRow) => (row.lastLoginAt ? Date.parse(row.lastLoginAt) : 0);
    items = [...items].sort((a, b) =>
      field === "name" ? sign * a.name.localeCompare(b.name) : sign * (login(a) - login(b)),
    );
  }
  const pageSize = pageSizeOf(search.pageSize);
  const page = Math.min(pageParam(search.page), Math.max(1, Math.ceil(items.length / pageSize)));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

async function Users({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/users">["searchParams"];
}) {
  const [staff, t, tc, tf, tl, ta] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.users"),
    getTranslations("Admin.common"),
    getTranslations("Admin.forbidden"),
    getTranslations("Admin.loginResult"),
    getTranslations("Admin.account"),
  ]);
  if (!hasRole(staff, "super-admin")) {
    return <AdminPageHeader title={tf("title")} lead={tf("body")} />;
  }
  const [all, search] = await Promise.all([adminGet<StaffRow[]>("/admin/users"), searchParams]);
  const list = pageOfStaff(all, search);
  // Recent sign-ins for the people on this page (a short list; issue 234).
  const histories = await Promise.all(
    list.items.map((row) =>
      adminGet<StaffLoginEvent[]>(`/admin/users/${encodeURIComponent(row.id)}/logins`),
    ),
  );
  const resultLabels = Object.fromEntries(
    StaffLoginResultSchema.options.map((result) => [result, tl(result)]),
  ) as Record<StaffLoginResult, string>;
  const roleNames = Object.fromEntries(
    RoleSchema.options.map((role) => [role, t(`roleNames.${role}`)]),
  ) as Record<Role, string>;
  const actionStrings = {
    roles: t("roles"),
    saveRoles: t("saveRoles"),
    resetPassword: t("resetPassword"),
    newPassword: t("newPassword"),
    deactivate: t("deactivate"),
    activate: t("activate"),
    updated: t("updated"),
    passwordReset: t("passwordReset"),
    resendInvite: t("resendInvite"),
    inviteSent: t("inviteSent"),
    resetTwoStep: t("resetTwoStep"),
    resetTwoStepLead: t("resetTwoStepLead"),
    resetTwoStepLeadOptional: t("resetTwoStepLeadOptional"),
    twoStepReset: t("twoStepReset"),
    cancel: tc("cancel"),
    failed: tc("unavailable"),
    takesLeads: t("takesLeads"),
    takesLeadsHint: t("takesLeadsHint"),
  };

  const rows: DataRow[] = list.items.map((row, index) => {
    // Invited until the first sign-in, Locked while sign-in is locked (ADMIN.md §8.6).
    const state = staffStatus(row);
    const roles = row.roles.map((role) => roleNames[role] ?? role).join(", ");
    const login = row.lastLoginAt ? formatDhakaDateTime(row.lastLoginAt) : t("never");
    const twoStep = row.twoStep ? t("twoStepOn") : t("twoStepOff");
    return {
      id: row.id,
      title: row.name,
      subtitle: row.email,
      thumb: { initials: initialsOf(row.name) },
      chips: [
        {
          family: "user",
          name: state === "deactivated" ? "disabled" : state,
          label: t(state),
          reason: t(`reasons.${state}`),
        },
      ],
      facts: {
        roles: { text: roles },
        login: { text: login, kind: row.lastLoginAt ? "date" : "muted" },
        twoStep: { text: twoStep, ...(row.twoStep ? {} : { kind: "muted" as const }) },
      },
      summary: [
        { label: t("email"), value: row.email },
        { label: t("roles"), value: roles },
        { label: t("lastLogin"), value: login },
        { label: t("twoStep"), value: twoStep },
        { label: t("takesLeads"), value: row.takesLeads ? t("takesLeadsOn") : t("takesLeadsOff") },
      ],
      actions: (
        <div className="flex flex-col gap-5">
          <StaffRowActions
            row={row}
            self={row.id === staff.id}
            twoStepRequired={twoStepRequired(row.roles)}
            roleNames={roleNames}
            strings={actionStrings}
          />
          <section aria-labelledby={`signins-${row.id}`} className="flex flex-col gap-1">
            <h3
              id={`signins-${row.id}`}
              className="text-[13px] font-semibold tracking-wide text-mist-600 uppercase"
            >
              {t("recentSignIns")}
            </h3>
            <LoginHistory
              events={(histories[index] ?? []).slice(0, 10)}
              resultLabels={resultLabels}
              newDeviceLabel={ta("newDevice")}
              emptyLabel={t("noSignIns")}
            />
          </section>
        </div>
      ),
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("name"), sort: "name", always: true },
    { key: "status", label: t("colStatus"), always: true },
    { key: "roles", label: t("roles") },
    { key: "login", label: t("lastLogin"), sort: "login" },
    { key: "twoStep", label: t("twoStep") },
  ];

  return (
    <SettingsFrame current="users">
      <AdminPageHeader
        title={t("title")}
        lead={t("lead")}
        actions={
          <StaffAddForm
            roleNames={roleNames}
            strings={{
              add: t("add"),
              name: t("name"),
              email: t("email"),
              roles: t("roles"),
              signIn: t("signIn"),
              inviteOption: t("inviteOption"),
              inviteHelp: t("inviteHelp"),
              passwordOption: t("passwordOption"),
              password: t("password"),
              passwordHint: t("passwordHint"),
              created: t("created"),
              invited: t("inviteSentTo", { email: "{email}" }),
              sendInvite: t("sendInvite"),
              cancel: tc("cancel"),
              save: tc("save"),
              failed: tc("unavailable"),
              lead: t("addLead"),
            }}
          />
        }
      />
      <AdminDataTable
        listKey="users"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        filters={[
          {
            param: "state",
            label: t("colStatus"),
            options: STATES.map((state) => ({ value: state, label: t(state) })),
          },
        ]}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
      <PermissionMatrix roleNames={roleNames} />
    </SettingsFrame>
  );
}

/** Users and roles (AdminUsers board), Super Admin only, on the shared DataTable (D0 R5). */
export default function UsersPage(props: PageProps<"/[locale]/secure-admin-control/users">) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <Users searchParams={props.searchParams} />
    </Suspense>
  );
}
