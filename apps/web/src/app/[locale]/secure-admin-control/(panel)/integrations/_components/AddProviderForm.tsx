"use client";

import { useId, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProviderKind } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from "@/i18n/navigation";
import { addCustomProvider } from "@/lib/admin/providerActions";
import { fill } from "./integrationStrings";

/** Sign-in providers take no custom entries (issue 134). */
type SupplierKind = Exclude<ProviderKind, "auth">;

type AddProviderFormProps = {
  /** The categories this tab adds to; more than one shows a category choice (SMS or email). */
  kinds: Array<{ kind: SupplierKind; label: string }>;
  strings: {
    title: string;
    hint: string;
    name: string;
    namePlaceholder: string;
    kind: string;
    submit: string;
    /** Contains {name}. */
    added: string;
    failed: string;
  };
};

/** Adds a supplier that is not in the catalog (issue 107); it starts off, in Sandbox, with generic API fields. */
function AddProviderForm({ kinds, strings }: AddProviderFormProps) {
  const id = useId();
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SupplierKind>(kinds[0]?.kind ?? "flight");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await addCustomProvider({ kind, name: name.trim() });
      if (!result.ok) {
        const message =
          result.problem.fields?.[0]?.message ?? result.problem.detail ?? strings.failed;
        setError(message);
        return;
      }
      setError(null);
      setName("");
      toast.success(fill(strings.added, { name: result.data.name }));
      router.refresh();
    });
  }

  return (
    <form
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-dashed border-mist-300 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div>
        <h3 id={`${id}-title`} className="font-display text-base font-bold text-navy-900">
          {strings.title}
        </h3>
        <p className="mt-0.5 text-sm text-mist-600">{strings.hint}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {kinds.length > 1 ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-navy-900">{strings.kind}</legend>
            <ToggleGroup
              type="single"
              variant="segment"
              value={kind}
              onValueChange={(next) => {
                const match = kinds.find((item) => item.kind === next);
                if (match) setKind(match.kind);
              }}
              className="max-w-full"
            >
              {kinds.map((item) => (
                <ToggleGroupItem key={item.kind} value={item.kind}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm">
          <Label htmlFor={`${id}-name`}>{strings.name}</Label>
          <Input
            id={`${id}-name`}
            value={name}
            maxLength={60}
            placeholder={strings.namePlaceholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          loading={pending}
          disabled={pending || name.trim().length < 2}
        >
          <Plus aria-hidden="true" />
          {strings.submit}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export { AddProviderForm };
