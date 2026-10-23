"use client";

import { useState } from "react";
import type { Role } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaff } from "@/lib/admin/opsActions";
import { RolePicker } from "./RolePicker";
import { useStaffAction } from "./useStaffAction";

type StaffAddFormProps = {
  roleNames: Record<Role, string>;
  strings: {
    add: string;
    name: string;
    email: string;
    roles: string;
    password: string;
    passwordHint: string;
    created: string;
    cancel: string;
    save: string;
    failed: string;
  };
};

const EMPTY = { name: "", email: "", password: "", roles: [] as Role[] };

/** Adds a staff member with a first password and their roles (AdminUsers board). */
function StaffAddForm({ roleNames, strings }: StaffAddFormProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const { pending, run } = useStaffAction(strings.failed);

  if (!adding) {
    return (
      <Button size="sm" onClick={() => setAdding(true)}>
        {strings.add}
      </Button>
    );
  }
  return (
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
                setDraft(EMPTY);
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
  );
}

export { StaffAddForm };
