"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@waafa/shared";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { deleteCustomRole, saveCustomRole } from "@/lib/admin/roleActions";

export type CustomRoleRow = { id: string; name: string; grants: Role[]; people: number };

type Grantable = "travel-sales" | "visa-officer" | "content-editor" | "shop-manager" | "accounts";
const GRANTABLE: Grantable[] = [
  "travel-sales",
  "visa-officer",
  "content-editor",
  "shop-manager",
  "accounts",
];

type CustomRolesPanelProps = {
  roles: CustomRoleRow[];
  roleNames: Record<Role, string>;
  strings: {
    title: string;
    lead: string;
    name: string;
    grants: string;
    add: string;
    edit: string;
    remove: string;
    save: string;
    cancel: string;
    people: string;
    empty: string;
    saved: string;
    failed: string;
    inUse: string;
  };
};

/**
 * Custom roles (issue 244): a name for a bundle of built-in roles, e.g. "Senior sales" = Travel sales + Visa officer.
 * Never Super Admin or Admin. Super Admin only; the change applies when people sign in again (the API signs them out).
 */
function CustomRolesPanel({ roles, roleNames, strings }: CustomRolesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<{
    id: string | null;
    name: string;
    grants: Grantable[];
  } | null>(null);

  const run = (
    work: () => Promise<{ ok: boolean; problem?: { status: number } }>,
    done = () => {},
  ) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(result.problem?.status === 409 ? strings.inUse : strings.failed);
        return;
      }
      toast.success(strings.saved);
      done();
      router.refresh();
    });

  return (
    <AdminPanel id="custom-roles" title={strings.title} lead={strings.lead} className="mt-8">
      <div className="flex flex-col gap-4">
        {roles.length === 0 ? (
          <p className="text-[14px] text-mist-600">{strings.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mist-100">
            {roles.map((role) => (
              <li key={role.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-900">{role.name}</p>
                  <p className="text-[13px] text-mist-600">
                    {role.grants.map((grant) => roleNames[grant] ?? grant).join(" + ")} ·{" "}
                    {strings.people.replace("{count}", String(role.people))}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-11 sm:min-h-9"
                    onClick={() =>
                      setEditing({
                        id: role.id,
                        name: role.name,
                        grants: role.grants.filter((grant): grant is Grantable =>
                          (GRANTABLE as string[]).includes(grant),
                        ),
                      })
                    }
                  >
                    {strings.edit} <span className="sr-only">{role.name}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-11 sm:min-h-9"
                    loading={pending}
                    onClick={() => run(() => deleteCustomRole(role.id))}
                  >
                    {strings.remove} <span className="sr-only">{role.name}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {editing ? (
          <form
            className="flex flex-col gap-3 border-t border-mist-100 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () => saveCustomRole(editing.id, { name: editing.name, grants: editing.grants }),
                () => setEditing(null),
              );
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-role-name">{strings.name}</Label>
              <Input
                id="custom-role-name"
                value={editing.name}
                maxLength={40}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[14px] font-semibold text-navy-900">
                {strings.grants}
              </legend>
              {GRANTABLE.map((grant) => (
                <div key={grant} className="flex min-h-11 items-center gap-2.5">
                  <Checkbox
                    id={`grant-${grant}`}
                    checked={editing.grants.includes(grant)}
                    onCheckedChange={(on) =>
                      setEditing({
                        ...editing,
                        grants: on
                          ? [...editing.grants, grant]
                          : editing.grants.filter((value) => value !== grant),
                      })
                    }
                  />
                  <Label htmlFor={`grant-${grant}`} className="font-normal">
                    {roleNames[grant]}
                  </Label>
                </div>
              ))}
            </fieldset>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                loading={pending}
                disabled={editing.name.trim().length < 2 || editing.grants.length === 0}
              >
                {strings.save}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                {strings.cancel}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <Button size="sm" onClick={() => setEditing({ id: null, name: "", grants: [] })}>
              {strings.add}
            </Button>
          </div>
        )}
      </div>
    </AdminPanel>
  );
}

export { CustomRolesPanel };
