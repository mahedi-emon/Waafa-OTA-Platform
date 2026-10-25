"use client";

import { useState } from "react";
import type { Role } from "@waafa/shared";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    signIn: string;
    inviteOption: string;
    inviteHelp: string;
    passwordOption: string;
    password: string;
    passwordHint: string;
    created: string;
    invited: string;
    cancel: string;
    save: string;
    sendInvite: string;
    failed: string;
    /** The dialog's line under its title. */
    lead: string;
  };
};

type How = "invite" | "password";

const EMPTY = { name: "", email: "", password: "", roles: [] as Role[] };

/**
 * Adds a staff member with their roles (ADMIN.md §5.6): the page header's primary button opens this dialog, like every
 * other "add" in Admin (issue 229). By default they get an invite email and choose their own password; a Super Admin
 * can still set a first password and pass it on.
 */
function StaffAddForm({ roleNames, strings }: StaffAddFormProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [how, setHow] = useState<How>("invite");
  const { pending, run } = useStaffAction(strings.failed);

  return (
    <Dialog open={adding} onOpenChange={setAdding}>
      <DialogTrigger asChild>
        <Button size="md">
          <UserPlus aria-hidden="true" />
          {strings.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] max-w-[min(680px,calc(100vw-24px))] overflow-y-auto">
        <DialogTitle className="font-display text-[20px] font-bold text-navy-900">
          {strings.add}
        </DialogTitle>
        <DialogDescription className="text-[14px] text-mist-600">{strings.lead}</DialogDescription>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          </div>
          <div className="flex flex-col gap-2">
            <p id="staff-sign-in" className="text-[14px] font-semibold text-navy-900">
              {strings.signIn}
            </p>
            <RadioGroup
              aria-labelledby="staff-sign-in"
              value={how}
              onValueChange={(value) => setHow(value as How)}
              className="grid grid-cols-1 gap-2 md:grid-cols-2"
            >
              <Label
                htmlFor="staff-how-invite"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-mist-200 p-3 has-data-[state=checked]:border-electric-600 has-data-[state=checked]:bg-electric-50"
              >
                <RadioGroupItem id="staff-how-invite" value="invite" className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-navy-900">{strings.inviteOption}</span>
                  <span className="text-[13px] font-normal text-mist-600">
                    {strings.inviteHelp}
                  </span>
                </span>
              </Label>
              <Label
                htmlFor="staff-how-password"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-mist-200 p-3 has-data-[state=checked]:border-electric-600 has-data-[state=checked]:bg-electric-50"
              >
                <RadioGroupItem id="staff-how-password" value="password" className="mt-0.5" />
                <span className="font-semibold text-navy-900">{strings.passwordOption}</span>
              </Label>
            </RadioGroup>
          </div>
          {how === "password" ? (
            <div className="flex max-w-md flex-col gap-1.5">
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
          ) : null}
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
                  () =>
                    createStaff({ ...draft, password: how === "password" ? draft.password : "" }),
                  how === "invite"
                    ? strings.invited.replace("{email}", draft.email.trim())
                    : strings.created,
                  () => {
                    setAdding(false);
                    setDraft(EMPTY);
                    setHow("invite");
                  },
                )
              }
            >
              {how === "invite" ? strings.sendInvite : strings.save}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { StaffAddForm };
