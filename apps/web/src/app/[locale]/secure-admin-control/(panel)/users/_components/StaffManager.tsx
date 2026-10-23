"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@waafa/shared";
import { staffStatus } from "@waafa/shared/workflow/derived";
import { StatusChip } from "@/components/admin/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { formatDhakaDateTime } from "@/lib/admin/format";
import type { ActionResult } from "@/lib/admin/leadActions";
import { createStaff, resetStaffPassword, updateStaff } from "@/lib/admin/opsActions";
import { USER_CHIPS } from "@/lib/admin/statusChips";
import type { StaffRow } from "@/lib/admin/types";
import { RolePicker } from "./RolePicker";

type StaffManagerProps = {
  rows: StaffRow[];
  selfId: string;
  roleNames: Record<Role, string>;
  strings: {
    add: string;
    name: string;
    email: string;
    roles: string;
    password: string;
    passwordHint: string;
    active: string;
    deactivated: string;
    locked: string;
    invited: string;
    /** Why each chip shows (D0 R4). */
    reasons: { active: string; invited: string; deactivated: string; locked: string };
    lastLogin: string;
    never: string;
    deactivate: string;
    activate: string;
    resetPassword: string;
    newPassword: string;
    saveRoles: string;
    created: string;
    updated: string;
    passwordReset: string;
    cancel: string;
    save: string;
    failed: string;
  };
};

/** Users and roles (AdminUsers board): add staff with a first password, edit roles, deactivate, reset a password. */
function StaffManager({ rows, selfId, roleNames, strings }: StaffManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "", roles: [] as Role[] });
  const [editing, setEditing] = useState<{ id: string; roles: Role[] } | null>(null);
  const [resetting, setResetting] = useState<{ id: string; password: string } | null>(null);

  function run(action: () => Promise<ActionResult>, success: string, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? strings.failed);
        return;
      }
      toast.success(success);
      after?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {adding ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-name">{strings.name}</Label>
                <Input
                  id="staff-name"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-email">{strings.email}</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-password">{strings.password}</Label>
                <Input
                  id="staff-password"
                  type="text"
                  autoComplete="off"
                  value={draft.password}
                  onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                  aria-describedby="staff-password-hint"
                />
                <p id="staff-password-hint" className="text-[12.5px] text-mist-600">
                  {strings.passwordHint}
                </p>
              </div>
            </div>
            <RolePicker
              idPrefix="new"
              value={draft.roles}
              onChange={(roles) => setDraft({ ...draft, roles })}
              roleNames={roleNames}
              label={strings.roles}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  run(
                    () => createStaff(draft),
                    strings.created,
                    () => {
                      setAdding(false);
                      setDraft({ name: "", email: "", password: "", roles: [] });
                    },
                  )
                }
              >
                {strings.save}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                {strings.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setAdding(true)}>
            {strings.add}
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-mist-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy-900">{row.name}</p>
                  {(() => {
                    // Invited until the first sign-in, Locked while sign-in is locked (ADMIN.md §8.6).
                    const state = staffStatus(row);
                    const chip = USER_CHIPS[state === "deactivated" ? "disabled" : state];
                    return (
                      <StatusChip
                        size="sm"
                        tone={chip.tone}
                        icon={chip.icon}
                        label={strings[state]}
                        reason={strings.reasons[state]}
                        focusable
                      />
                    );
                  })()}
                </div>
                <p className="text-[14px] break-all text-mist-700">{row.email}</p>
                <p className="mt-1 text-[13px] text-mist-600">
                  {row.roles.map((role) => roleNames[role] ?? role).join(", ")} ·{" "}
                  {strings.lastLogin}:{" "}
                  {row.lastLoginAt ? formatDhakaDateTime(row.lastLoginAt) : strings.never}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing({ id: row.id, roles: row.roles })}
                >
                  {strings.roles}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setResetting({ id: row.id, password: "" })}
                >
                  {strings.resetPassword}
                </Button>
                {row.id !== selfId ? (
                  <Button
                    size="sm"
                    variant={row.status === "active" ? "ghost" : "soft"}
                    loading={pending}
                    onClick={() =>
                      run(
                        () =>
                          updateStaff(row.id, {
                            status: row.status === "active" ? "deactivated" : "active",
                          }),
                        strings.updated,
                      )
                    }
                  >
                    {row.status === "active" ? strings.deactivate : strings.activate}
                  </Button>
                ) : null}
              </div>
            </div>
            {editing?.id === row.id ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-mist-100 pt-4">
                <RolePicker
                  idPrefix={row.id}
                  value={editing.roles}
                  onChange={(roles) => setEditing({ id: row.id, roles })}
                  roleNames={roleNames}
                  label={strings.roles}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={pending}
                    onClick={() =>
                      run(
                        () => updateStaff(row.id, { roles: editing.roles }),
                        strings.updated,
                        () => setEditing(null),
                      )
                    }
                  >
                    {strings.saveRoles}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    {strings.cancel}
                  </Button>
                </div>
              </div>
            ) : null}
            {resetting?.id === row.id ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-mist-100 pt-4 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`reset-${row.id}`}>{strings.newPassword}</Label>
                  <Input
                    id={`reset-${row.id}`}
                    type="text"
                    autoComplete="off"
                    value={resetting.password}
                    onChange={(event) => setResetting({ id: row.id, password: event.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={pending}
                    onClick={() =>
                      run(
                        () => resetStaffPassword(row.id, resetting.password),
                        strings.passwordReset,
                        () => setResetting(null),
                      )
                    }
                  >
                    {strings.resetPassword}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setResetting(null)}>
                    {strings.cancel}
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { StaffManager };
