"use client";

import { useState } from "react";
import type { Role } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { resendStaffInvite, resetStaffPassword, updateStaff } from "@/lib/admin/opsActions";
import { resetStaffTwoStep } from "@/lib/admin/twoStepActions";
import type { StaffRow } from "@/lib/admin/types";
import { RolePicker } from "./RolePicker";
import { useStaffAction } from "./useStaffAction";

type StaffRowActionsProps = {
  row: StaffRow;
  self: boolean;
  /** Their role needs two-step sign-in, so a reset means setting it up again (issue 234). */
  twoStepRequired: boolean;
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
    resendInvite: string;
    inviteSent: string;
    resetTwoStep: string;
    resetTwoStepLead: string;
    resetTwoStepLeadOptional: string;
    twoStepReset: string;
    cancel: string;
    failed: string;
    takesLeads: string;
    takesLeadsHint: string;
  };
};

/**
 * One staff member's steps in the side sheet: roles, a new password, a two-step sign-in reset (issue 234), deactivate
 * or activate (never yourself).
 */
function StaffRowActions({ row, self, twoStepRequired, roleNames, strings }: StaffRowActionsProps) {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [twoStep, setTwoStep] = useState(false);
  const { pending, run } = useStaffAction(strings.failed);

  return (
    <div className="flex flex-col gap-4">
      {row.status === "active" ? (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-mist-25 p-3 ring-1 ring-mist-100">
          <label htmlFor={`takes-leads-${row.id}`} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-navy-900">{strings.takesLeads}</span>
            <span className="text-[12.5px] text-mist-600">{strings.takesLeadsHint}</span>
          </label>
          <Switch
            id={`takes-leads-${row.id}`}
            checked={row.takesLeads}
            disabled={pending}
            onCheckedChange={(on) =>
              run(() => updateStaff(row.id, { takesLeads: on }), strings.updated)
            }
          />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {row.invite && !row.lastLoginAt && row.status === "active" ? (
          <Button
            size="sm"
            loading={pending}
            onClick={() => run(() => resendStaffInvite(row.id), strings.inviteSent)}
          >
            {strings.resendInvite}
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" onClick={() => setRoles(row.roles)}>
          {strings.roles}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setPassword("")}>
          {strings.resetPassword}
        </Button>
        {row.twoStep ? (
          <Button size="sm" variant="secondary" onClick={() => setTwoStep(true)}>
            {strings.resetTwoStep}
          </Button>
        ) : null}
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
      {twoStep ? (
        <div className="flex flex-col gap-3 border-t border-mist-100 pt-4">
          <p className="text-[14px] text-ink-900">
            {twoStepRequired ? strings.resetTwoStepLead : strings.resetTwoStepLeadOptional}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              loading={pending}
              onClick={() =>
                run(
                  () => resetStaffTwoStep(row.id),
                  strings.twoStepReset,
                  () => setTwoStep(false),
                )
              }
            >
              {strings.resetTwoStep}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTwoStep(false)}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { StaffRowActions };
