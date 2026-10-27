"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AddressView } from "@waafa/shared";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DIVISIONS } from "@/lib/shop/checkoutFormFields";
import { accountError, postAccount, type AccountErrors } from "./postAccount";

export type AddressLabels = {
  empty: string;
  add: string;
  edit: string;
  remove: string;
  label: string;
  labelHint: string;
  name: string;
  phone: string;
  country: string;
  division: string;
  district: string;
  area: string;
  street: string;
  default: string;
  isDefault: string;
  makeDefault: string;
  save: string;
  cancel: string;
  saved: string;
  removedDone: string;
  full: string;
};

type AddressesEditorProps = {
  addresses: AddressView[];
  countries: Array<{ code: string; name: string; dial: string }>;
  labels: AddressLabels;
  errors: AccountErrors;
};

type Draft = {
  label: string;
  name: string;
  phone: string;
  phoneCountry: string;
  division: string;
  district: string;
  area: string;
  street: string;
  isDefault: boolean;
};

/** "+8801712345678" → "01712345678" for the Bangladesh box; other numbers stay as they are. */
const national = (e164: string) => (e164.startsWith("+880") ? `0${e164.slice(4)}` : e164);

/** Delivery addresses in My account (issue 278): the default one fills in at checkout. */
function AddressesEditor({ addresses: initial, countries, labels, errors }: AddressesEditorProps) {
  // The list lives here and follows each answer (the API's default rules mirrored), so a change never reloads the page.
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blank: Draft = {
    label: "",
    name: "",
    phone: "",
    phoneCountry: countries[0]?.code ?? "BD",
    division: "Dhaka",
    district: "",
    area: "",
    street: "",
    isDefault: addresses.length === 0,
  };
  const [draft, setDraft] = useState<Draft>(blank);

  function open(address?: AddressView) {
    setProblem(null);
    setEditing(address?.id ?? "new");
    setDraft(
      address
        ? {
            label: address.label ?? "",
            name: address.name,
            phone: national(address.phone),
            phoneCountry: address.phone.startsWith("+880") ? "BD" : (countries[0]?.code ?? "BD"),
            division: address.division,
            district: address.district,
            area: address.area,
            street: address.street,
            isDefault: address.isDefault,
          }
        : blank,
    );
  }

  function run(op: string, data?: unknown, id?: string, done?: string) {
    startTransition(async () => {
      const answer = await postAccount(op, data, id);
      if (!answer.ok) {
        const message = accountError(answer, errors, labels.full);
        if (editing) setProblem(message);
        else toast.error(message);
        return;
      }
      const { ok: _ok, ...rest } = answer;
      setAddresses((list) => {
        if (op === "address.remove") {
          const removed = list.find((item) => item.id === id);
          const left = list.filter((item) => item.id !== id);
          // The oldest address left becomes the default when the default goes.
          return removed?.isDefault && left[0]
            ? left.map((item, index) => ({ ...item, isDefault: index === 0 }))
            : left;
        }
        const view = rest as unknown as AddressView;
        const others = view.isDefault ? list.map((item) => ({ ...item, isDefault: false })) : list;
        return list.some((item) => item.id === view.id)
          ? others.map((item) => (item.id === view.id ? view : item))
          : [...others, view];
      });
      if (done) toast.success(done);
      setEditing(null);
    });
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { label, ...rest } = draft;
    const data = { ...rest, ...(label.trim() ? { label } : {}) };
    run(
      editing === "new" ? "address.add" : "address.update",
      data,
      editing === "new" ? undefined : (editing ?? undefined),
      labels.saved,
    );
  }

  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]) =>
      setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="flex flex-col gap-3">
      {addresses.length === 0 && editing === null ? (
        <p className="text-[14.5px] text-mist-700">{labels.empty}</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-mist-200 bg-white p-4"
          >
            <span className="min-w-0 text-[14.5px] text-ink-900">
              <span className="flex flex-wrap items-center gap-2 font-semibold text-navy-900">
                {address.label ?? address.name}
                {address.isDefault ? <Badge variant="neutral">{labels.isDefault}</Badge> : null}
              </span>
              <span className="block text-mist-700">
                {[address.street, address.area, address.district, address.division].join(", ")}
              </span>
            </span>
            <span className="flex flex-wrap gap-1">
              {address.isDefault ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      "address.update",
                      {
                        name: address.name,
                        // Already E.164: the route reads the "+" form whatever the country.
                        phone: address.phone,
                        division: address.division,
                        district: address.district,
                        area: address.area,
                        street: address.street,
                        ...(address.label ? { label: address.label } : {}),
                        isDefault: true,
                      },
                      address.id,
                      labels.saved,
                    )
                  }
                >
                  {labels.makeDefault}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.edit}
                onClick={() => open(address)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.remove}
                disabled={pending}
                onClick={() => run("address.remove", undefined, address.id, labels.removedDone)}
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
          <FormField id="address-label" label={labels.label}>
            {(describedBy) => (
              <Input
                id="address-label"
                placeholder={labels.labelHint}
                value={draft.label}
                onChange={(event) => set("label")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <FormField id="address-name" label={labels.name}>
            {(describedBy) => (
              <Input
                id="address-name"
                autoComplete="name"
                required
                value={draft.name}
                onChange={(event) => set("name")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <div className="sm:col-span-2">
            <FormField id="address-phone" label={labels.phone}>
              {(describedBy) => (
                <PhoneField
                  id="address-phone"
                  countries={countries}
                  country={draft.phoneCountry}
                  onCountryChange={(code) => set("phoneCountry")(code)}
                  countryLabel={labels.country}
                  invalid={false}
                  describedBy={describedBy}
                  inputProps={{
                    name: "phone",
                    value: draft.phone,
                    onChange: (event) => set("phone")(event.target.value),
                    autoComplete: "tel-national",
                  }}
                />
              )}
            </FormField>
          </div>
          <FormField id="address-division" label={labels.division}>
            {() => (
              <NativeSelect
                id="address-division"
                value={draft.division}
                onChange={(event) => set("division")(event.target.value)}
              >
                {DIVISIONS.map((division) => (
                  <NativeSelectOption key={division} value={division}>
                    {division}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField id="address-district" label={labels.district}>
            {(describedBy) => (
              <Input
                id="address-district"
                required
                value={draft.district}
                onChange={(event) => set("district")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <FormField id="address-area" label={labels.area}>
            {(describedBy) => (
              <Input
                id="address-area"
                required
                value={draft.area}
                onChange={(event) => set("area")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <FormField id="address-street" label={labels.street}>
            {(describedBy) => (
              <Input
                id="address-street"
                autoComplete="street-address"
                required
                value={draft.street}
                onChange={(event) => set("street")(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <div className="flex min-h-11 items-center gap-3 sm:col-span-2">
            <Checkbox
              id="address-default"
              checked={draft.isDefault}
              onCheckedChange={(checked) => set("isDefault")(checked)}
            />
            <label htmlFor="address-default" className="text-[14.5px] text-ink-900">
              {labels.default}
            </label>
          </div>
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

export { AddressesEditor };
