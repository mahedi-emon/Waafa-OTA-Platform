"use client";

import { useState } from "react";
import type { Role } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetStaffPassword, updateStaff } from "@/lib/admin/opsActions";
import type { StaffRow } from "@/lib/admin/types";
import { RolePicker } from "./RolePicker";
import { useStaffAction } from "./useStaffAction";

type StaffRowActionsProps = {
  row: StaffRow;
  self: boolean;
  roleNames: Record<Role, string>;
  strings: {
    roles: string;
    saveRoles: string;
    resetPassword: string;
    newPassword: string;
    deactivate: string;
    activate: string;
    updated: string;
    passwordReset: string;
    cancel: string;
    failed: string;
  };
};

/** One staff member's steps in the side sheet: roles, a new password, deactivate or activate (never yourself). */
function StaffRowActions({ row, self, roleNames, strings }: StaffRowActionsProps) {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const { pending, run } = useStaffAction(strings.failed);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setRoles(row.roles)}>
          {strings.roles}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setPassword("")}>
          {strings.resetPassword}
        </Button>
        {!self ? (
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
      {roles ? (
        <div className="flex flex-col gap-3 border-t border-mist-100 pt-4">
          <RolePicker
            idPrefix={row.id}
            value={roles}
            onChange={setRoles}
            roleNames={roleNames}
            label={strings.roles}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={pending}
              onClick={() =>
                run(
                  () => updateStaff(row.id, { roles }),
                  strings.updated,
                  () => setRoles(null),
                )
              }
            >
              {strings.saveRoles}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRoles(null)}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      ) : null}
      {password !== null ? (
        <div className="flex flex-col gap-3 border-t border-mist-100 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`reset-${row.id}`}>{strings.newPassword}</Label>
            <Input
              id={`reset-${row.id}`}
              type="text"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={pending}
              onClick={() =>
                run(
                  () => resetStaffPassword(row.id, password),
                  strings.passwordReset,
                  () => setPassword(null),
                )
              }
            >
              {strings.resetPassword}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPassword(null)}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { StaffRowActions };
