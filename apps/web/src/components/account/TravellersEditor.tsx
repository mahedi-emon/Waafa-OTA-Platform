"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, type TravellerView } from "@waafa/shared";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useRouter } from "@/i18n/navigation";
import { accountError, postAccount, type AccountErrors } from "./postAccount";

export type TravellerLabels = {
  empty: string;
  add: string;
  edit: string;
  remove: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportKeep: string;
  passportExpiry: string;
  passport: string;
  expires: string;
  save: string;
  cancel: string;
  saved: string;
  removedDone: string;
  full: string;
};

type TravellersEditorProps = {
  travellers: TravellerView[];
  nationalities: Array<{ code: string; name: string }>;
  labels: TravellerLabels;
  errors: AccountErrors;
};

type Draft = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
};

const blank: Draft = {
  fullName: "",
  dateOfBirth: "",
  nationality: "BD",
  passportNumber: "",
  passportExpiry: "",
};

/** Saved travellers in My account (issue 278): add, edit and remove; the passport number is sent once and shown masked. */
function TravellersEditor({ travellers, nationalities, labels, errors }: TravellersEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open(traveller?: TravellerView) {
    setProblem(null);
    setEditing(traveller?.id ?? "new");
    setDraft(
      traveller
        ? {
            fullName: traveller.fullName,
            dateOfBirth: traveller.dateOfBirth ?? "",
            nationality: traveller.nationality ?? "BD",
            passportNumber: "",
            passportExpiry: traveller.passportExpiry ?? "",
          }
        : blank,
    );
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = {
      fullName: draft.fullName,
      ...(draft.dateOfBirth ? { dateOfBirth: draft.dateOfBirth } : {}),
      ...(draft.nationality ? { nationality: draft.nationality } : {}),
      ...(draft.passportNumber ? { passportNumber: draft.passportNumber } : {}),
      ...(draft.passportExpiry ? { passportExpiry: draft.passportExpiry } : {}),
    };
    startTransition(async () => {
      const answer =
        editing === "new"
          ? await postAccount("traveller.add", data)
          : await postAccount("traveller.update", data, editing ?? undefined);
      if (!answer.ok) {
        setProblem(accountError(answer, errors, labels.full));
        return;
      }
      toast.success(labels.saved);
      setEditing(null);
      router.refresh();
    });
  }

  function remove(traveller: TravellerView) {
    startTransition(async () => {
      const answer = await postAccount("traveller.remove", undefined, traveller.id);
      if (!answer.ok) {
        toast.error(accountError(answer, errors));
        return;
      }
      toast.success(labels.removedDone);
      router.refresh();
    });
  }

  const set = (key: keyof Draft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="flex flex-col gap-3">
      {travellers.length === 0 && editing === null ? (
        <p className="text-[14.5px] text-mist-700">{labels.empty}</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {travellers.map((traveller) => (
          <li
            key={traveller.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-mist-200 bg-white p-4"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-navy-900">{traveller.fullName}</span>
              {traveller.passportMasked ? (
                <span className="block text-[13.5px] text-mist-700 tabular-nums">
                  {labels.passport.replace("{masked}", traveller.passportMasked)}
                  {traveller.passportExpiry
                    ? ` · ${labels.expires.replace("{date}", formatDate(traveller.passportExpiry))}`
                    : ""}
                </span>
              ) : null}
            </span>
            <span className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => open(traveller)}
                aria-label={labels.edit.replace("{name}", traveller.fullName)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(traveller)}
                aria-label={labels.remove.replace("{name}", traveller.fullName)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </span>
          </li>
        ))}
      </ul>

      {editing ? (
        <form
          onSubmit={save}
          noValidate
          className="grid grid-cols-1 gap-4 rounded-2xl border border-mist-200 bg-white p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <FormField id="traveller-name" label={labels.fullName}>
              {(describedBy) => (
                <Input
                  id="traveller-name"
                  autoComplete="name"
                  required
                  value={draft.fullName}
                  onChange={(event) => set("fullName")(event.target.value)}
                  aria-describedby={describedBy}
                />
              )}
            </FormField>
          </div>
          <FormField id="traveller-dob" label={labels.dateOfBirth}>
            {(describedBy) => (
              <Input
                id="traveller-dob"
                type="date"
                value={draft.dateOfBirth}
                onChange={(event) => set("dateOfBirth")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <FormField id="traveller-nationality" label={labels.nationality}>
            {() => (
              <NativeSelect
                id="traveller-nationality"
                value={draft.nationality}
                onChange={(event) => set("nationality")(event.target.value)}
              >
                {nationalities.map((country) => (
                  <NativeSelectOption key={country.code} value={country.code}>
                    {country.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField
            id="traveller-passport"
            label={labels.passportNumber}
            {...(editing !== "new" ? { hint: labels.passportKeep } : {})}
          >
            {(describedBy) => (
              <Input
                id="traveller-passport"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={draft.passportNumber}
                onChange={(event) => set("passportNumber")(event.target.value.toUpperCase())}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <FormField id="traveller-expiry" label={labels.passportExpiry}>
            {(describedBy) => (
              <Input
                id="traveller-expiry"
                type="date"
                value={draft.passportExpiry}
                onChange={(event) => set("passportExpiry")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          {problem ? (
            <p role="alert" className="text-[14px] text-danger-700 sm:col-span-2">
              {problem}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" loading={pending}>
              {labels.save}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {labels.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" className="self-start" onClick={() => open()}>
          <Plus aria-hidden="true" />
          {labels.add}
        </Button>
      )}
    </div>
  );
}

export { TravellersEditor };
