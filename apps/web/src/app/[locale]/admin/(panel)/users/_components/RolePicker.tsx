"use client";

import type { Role } from "@waafa/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ROLES: Role[] = [
  "super-admin",
  "admin",
  "travel-sales",
  "visa-officer",
  "shop-manager",
  "content-editor",
  "accounts",
];

type RolePickerProps = {
  idPrefix: string;
  value: Role[];
  onChange: (roles: Role[]) => void;
  roleNames: Record<Role, string>;
  label: string;
};

/** The eight PRD roles as checkboxes (one person can hold several). */
function RolePicker({ idPrefix, value, onChange, roleNames, label }: RolePickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[14px] font-semibold text-navy-900">{label}</legend>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {ROLES.map((role) => (
          <div key={role} className="flex min-h-11 items-center gap-3">
            <Checkbox
              id={`${idPrefix}-${role}`}
              checked={value.includes(role)}
              onCheckedChange={(checked) =>
                onChange(
                  checked === true ? [...value, role] : value.filter((item) => item !== role),
                )
              }
            />
            <Label htmlFor={`${idPrefix}-${role}`} className="font-normal">
              {roleNames[role]}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export { RolePicker };
