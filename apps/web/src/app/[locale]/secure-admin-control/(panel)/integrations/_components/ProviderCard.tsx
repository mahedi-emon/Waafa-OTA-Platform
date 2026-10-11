"use client";

import { useId, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import type {
  ProviderConnectionView,
  ProviderDefinition,
  ProviderEnvironment,
} from "@waafa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from "@/i18n/navigation";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { removeProvider, saveProvider, testProvider } from "@/lib/admin/providerActions";

export type ProviderCardStrings = {
  environment: string;
  sandbox: string;
  production: string;
  notConnected: string;
  connected: string;
  off: string;
  enabled: string;
  enabledHint: string;
  /** Contains {last4}. */
  secretSaved: string;
  secretSavedShort: string;
  optional: string;
  connect: string;
  manage: string;
  close: string;
  test: string;
  remove: string;
  /** Contains {name} and {environment}. */
  removeConfirm: string;
  /** Contains {name}. */
  savedToast: string;
  removedToast: string;
  healthOk: string;
  healthFail: string;
  neverTested: string;
  note: string;
  /** Contains {time} and {name}. */
  updated: string;
  save: string;
  failed: string;
};

type ProviderCardProps = {
  definition: ProviderDefinition;
  connections: ProviderConnectionView[];
  canSaveSecrets: boolean;
  strings: ProviderCardStrings;
};

type Draft = {
  enabled: boolean;
  settings: Record<string, string>;
  secrets: Record<string, string>;
  note: string;
};

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");

function draftFor(connection: ProviderConnectionView | undefined): Draft {
  return {
    enabled: connection?.enabled ?? false,
    settings: { ...(connection?.settings ?? {}) },
    secrets: {},
    note: connection?.note ?? "",
  };
}

/**
 * One external API in Admin › Integrations (#82): its status in each environment and, opened, the connection form.
 * Secrets are write-only: the form shows "saved, ends in 1234" and an empty field keeps the saved value.
 */
function ProviderCard({ definition, connections, canSaveSecrets, strings }: ProviderCardProps) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [environment, setEnvironment] = useState<ProviderEnvironment>(
    connections.find((item) => item.environment === "production") ? "production" : "sandbox",
  );
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
              enabled: draft.enabled,
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
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-navy-900">{definition.name}</h3>
          <p className="mt-0.5 text-sm text-mist-600">{definition.summary}</p>
        </div>
        <Button
          type="button"
          variant={open ? "ghost" : "secondary"}
          size="sm"
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? strings.close : connections.length > 0 ? strings.manage : strings.connect}
        </Button>
      </header>

      <ul className="flex flex-wrap gap-2" aria-label={strings.environment}>
        {(["sandbox", "production"] as const).map((env) => {
          const saved = connections.find((item) => item.environment === env);
          const label = env === "production" ? strings.production : strings.sandbox;
          return (
            <li key={env}>
              <Badge variant={!saved ? "neutral" : saved.enabled ? "success" : "warning"}>
                {label}:{" "}
                {!saved ? strings.notConnected : saved.enabled ? strings.connected : strings.off}
              </Badge>
            </li>
          );
        })}
      </ul>

      {open ? (
        <form
          id={formId}
          className="flex min-w-0 flex-col gap-4 border-t border-mist-100 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            run("save");
          }}
        >
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-navy-900">
              {strings.environment}
            </legend>
            <ToggleGroup
              type="single"
              variant="segment"
              value={environment}
              onValueChange={switchEnvironment}
              className="w-fit"
            >
              <ToggleGroupItem value="sandbox">{strings.sandbox}</ToggleGroupItem>
              <ToggleGroupItem value="production">{strings.production}</ToggleGroupItem>
            </ToggleGroup>
          </fieldset>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {definition.fields.map((field) => {
              const id = `${formId}-${field.key}`;
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
              const value = field.secret
                ? (draft.secrets[field.key] ?? "")
                : (draft.settings[field.key] ?? "");
              return (
                <div
                  key={field.key}
                  className={
                    field.type === "url"
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
                  <Input
                    id={id}
                    type={field.secret ? "password" : field.type === "url" ? "url" : "text"}
                    autoComplete={field.secret ? "new-password" : "off"}
                    spellCheck={false}
                    inputMode={field.type === "url" ? "url" : undefined}
                    disabled={field.secret && !canSaveSecrets}
                    value={value}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={hint || error ? `${id}-help` : undefined}
                    onChange={(event) => {
                      const next = event.target.value;
                      setDraft((current) =>
                        field.secret
                          ? { ...current, secrets: { ...current.secrets, [field.key]: next } }
                          : { ...current, settings: { ...current.settings, [field.key]: next } },
                      );
                    }}
                  />
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

          <div className="flex items-start gap-3">
            <Switch
              id={`${formId}-enabled`}
              checked={draft.enabled}
              onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
              aria-describedby={`${formId}-enabled-hint`}
            />
            <div className="min-w-0">
              <Label htmlFor={`${formId}-enabled`}>{strings.enabled}</Label>
              <p id={`${formId}-enabled-hint`} className="text-sm text-mist-600">
                {strings.enabledHint}
              </p>
            </div>
          </div>

          {connection ? (
            <p className="flex items-start gap-2 text-sm text-mist-700" role="status">
              {connection.health ? (
                connection.health.ok ? (
                  <CircleCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-success-600"
                  />
                ) : (
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-danger-600"
                  />
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
            <Button
              type="submit"
              size="sm"
              loading={pending && action === "save"}
              disabled={pending}
            >
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
      ) : null}
    </article>
  );
}

export { ProviderCard };
