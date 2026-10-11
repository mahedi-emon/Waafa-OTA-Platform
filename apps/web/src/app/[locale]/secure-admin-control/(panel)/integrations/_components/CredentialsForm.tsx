"use client";

import { useState, useTransition } from "react";
import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import type {
  ProviderConnectionView,
  ProviderDefinition,
  ProviderEnvironment,
} from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from "@/i18n/navigation";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { removeProvider, saveProvider, testProvider } from "@/lib/admin/providerActions";
import { fill, type IntegrationStrings } from "./integrationStrings";
import { SecretInput } from "./SecretInput";

type CredentialsFormProps = {
  formId: string;
  definition: ProviderDefinition;
  connections: ProviderConnectionView[];
  /** The environment the provider uses now (Live → production). */
  inUse: ProviderEnvironment;
  canSaveSecrets: boolean;
  strings: IntegrationStrings;
};

type Draft = { settings: Record<string, string>; secrets: Record<string, string>; note: string };

function draftFor(connection: ProviderConnectionView | undefined): Draft {
  return {
    settings: { ...(connection?.settings ?? {}) },
    secrets: {},
    note: connection?.note ?? "",
  };
}

/**
 * Sandbox and Live credentials of one provider (issues 82 and 107): plain settings in full, secrets write-only (an empty
 * field keeps the saved value), a reachability test and removal per environment.
 */
function CredentialsForm({
  formId,
  definition,
  connections,
  inUse,
  canSaveSecrets,
  strings,
}: CredentialsFormProps) {
  const router = useRouter();
  const [environment, setEnvironment] = useState<ProviderEnvironment>(inUse);
  const connection = connections.find((item) => item.environment === environment);
  const [draft, setDraft] = useState<Draft>(() => draftFor(connection));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"save" | "test" | "remove" | null>(null);
  const envName = environment === "production" ? strings.production : strings.sandbox;

  function switchEnvironment(next: string) {
    if (next !== "sandbox" && next !== "production") return;
    setEnvironment(next);
    setDraft(draftFor(connections.find((item) => item.environment === next)));
    setErrors({});
  }

  function run(kind: "save" | "test" | "remove") {
    if (
      kind === "remove" &&
      !window.confirm(fill(strings.removeConfirm, { name: definition.name, environment: envName }))
    )
      return;
    setAction(kind);
    startTransition(async () => {
      const result =
        kind === "save"
          ? await saveProvider(definition.id, environment, {
              settings: draft.settings,
              secrets: draft.secrets,
              ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
            })
          : kind === "test"
            ? await testProvider(definition.id, environment)
            : await removeProvider(definition.id, environment);
      setAction(null);
      if (!result.ok) {
        const fieldErrors = Object.fromEntries(
          (result.problem.fields ?? []).map((field) => [field.path, field.message]),
        );
        setErrors(fieldErrors);
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? strings.failed);
        return;
      }
      setErrors({});
      if (kind === "save") {
        setDraft((current) => ({ ...current, secrets: {} }));
        toast.success(fill(strings.savedToast, { name: definition.name }));
      } else if (kind === "remove") {
        setDraft(draftFor(undefined));
        toast.success(fill(strings.removedToast, { name: definition.name }));
      } else if (result.data && "health" in result.data && result.data.health) {
        const health = result.data.health;
        if (health.ok) toast.success(health.message);
        else toast.error(health.message);
      }
      router.refresh();
    });
  }

  return (
    <form
      id={formId}
      className="flex min-w-0 flex-col gap-4 border-t border-mist-100 pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        run("save");
      }}
    >
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-navy-900">{strings.credentials}</legend>
        <ToggleGroup
          type="single"
          variant="segment"
          value={environment}
          onValueChange={switchEnvironment}
          className="max-w-full"
          aria-label={strings.environment}
        >
          <ToggleGroupItem value="sandbox">{strings.sandbox}</ToggleGroupItem>
          <ToggleGroupItem value="production">{strings.production}</ToggleGroupItem>
        </ToggleGroup>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {definition.fields.map((field) => {
          const id = `${formId}-${environment}-${field.key}`;
          const path = `${field.secret ? "secrets" : "settings"}.${field.key}`;
          const saved = connection?.secrets[field.key];
          const error = errors[path];
          const hint = field.secret
            ? saved
              ? saved.last4
                ? fill(strings.secretSaved, { last4: saved.last4 })
                : strings.secretSavedShort
              : undefined
            : field.hint;
          const describedBy = hint || error ? `${id}-help` : undefined;
          const setValue = (next: string) =>
            setDraft((current) =>
              field.secret
                ? { ...current, secrets: { ...current.secrets, [field.key]: next } }
                : { ...current, settings: { ...current.settings, [field.key]: next } },
            );
          return (
            <div
              key={`${environment}-${field.key}`}
              className={
                field.type === "url" || field.key === "extraHeaders"
                  ? "flex min-w-0 flex-col gap-1.5 md:col-span-2"
                  : "flex min-w-0 flex-col gap-1.5"
              }
            >
              <Label htmlFor={id}>
                {field.label}
                {field.required ? null : (
                  <span className="font-normal text-mist-500"> ({strings.optional})</span>
                )}
              </Label>
              {field.secret ? (
                <SecretInput
                  id={id}
                  label={field.label}
                  provider={definition.id}
                  environment={environment}
                  fieldKey={field.key}
                  value={draft.secrets[field.key] ?? ""}
                  saved={Boolean(saved)}
                  disabled={!canSaveSecrets}
                  invalid={Boolean(error)}
                  {...(describedBy ? { describedBy } : {})}
                  onChange={setValue}
                  strings={strings}
                />
              ) : (
                <Input
                  id={id}
                  type={field.type === "url" ? "url" : "text"}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode={
                    field.type === "url" ? "url" : field.type === "number" ? "numeric" : undefined
                  }
                  value={draft.settings[field.key] ?? ""}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy}
                  onChange={(event) => setValue(event.target.value)}
                />
              )}
              {hint || error ? (
                <p
                  id={`${id}-help`}
                  className={error ? "text-sm text-danger-600" : "text-sm text-mist-600"}
                >
                  {error ?? hint}
                </p>
              ) : null}
            </div>
          );
        })}
        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <Label htmlFor={`${formId}-note`}>
            {strings.note}
            <span className="font-normal text-mist-500"> ({strings.optional})</span>
          </Label>
          <Input
            id={`${formId}-note`}
            maxLength={300}
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          />
        </div>
      </div>

      {connection ? (
        <p className="flex items-start gap-2 text-sm text-mist-700" role="status">
          {connection.health ? (
            connection.health.ok ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-600" />
            ) : (
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-600" />
            )
          ) : (
            <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mist-500" />
          )}
          <span className="min-w-0">
            <span className="font-semibold">
              {connection.health
                ? connection.health.ok
                  ? strings.healthOk
                  : strings.healthFail
                : strings.neverTested}
            </span>
            {connection.health ? (
              <>
                {" · "}
                {formatDhakaDateTime(connection.health.at)}
                <span className="block text-mist-600">{connection.health.message}</span>
              </>
            ) : null}
            <span className="block text-mist-500">
              {fill(strings.updated, {
                time: formatDhakaDateTime(connection.updatedAt),
                name: connection.updatedBy ?? "—",
              })}
            </span>
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" loading={pending && action === "save"} disabled={pending}>
          {strings.save}
        </Button>
        {connection ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pending && action === "test"}
              disabled={pending}
              onClick={() => run("test")}
            >
              {strings.test}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger-600"
              loading={pending && action === "remove"}
              disabled={pending}
              onClick={() => run("remove")}
            >
              {strings.remove}
            </Button>
          </>
        ) : null}
      </div>
    </form>
  );
}

export { CredentialsForm };
