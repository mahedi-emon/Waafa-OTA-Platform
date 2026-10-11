"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import type {
  IntegrationSettingView,
  ProviderConnectionView,
  ProviderDefinition,
} from "@waafa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { removeCustomProvider } from "@/lib/admin/providerActions";
import { CredentialsForm } from "./CredentialsForm";
import { fill, type IntegrationStrings } from "./integrationStrings";
import { ProviderSettingsForm } from "./ProviderSettingsForm";

type ProviderCardProps = {
  definition: ProviderDefinition;
  setting: IntegrationSettingView;
  connections: ProviderConnectionView[];
  canSaveSecrets: boolean;
  strings: IntegrationStrings;
};

/**
 * One external API in Admin › Integrations (issues 82 and 107): Active and mode badges, the provider switches and markup,
 * and, opened, its Sandbox and Live credentials. Custom providers can be removed with their credentials.
 */
function ProviderCard({
  definition,
  setting,
  connections,
  canSaveSecrets,
  strings,
}: ProviderCardProps) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [removing, startRemove] = useTransition();
  const inUse = setting.isLive ? "production" : "sandbox";

  function removeCustom() {
    if (!window.confirm(fill(strings.removeProviderConfirm, { name: setting.name }))) return;
    startRemove(async () => {
      const result = await removeCustomProvider(setting.provider);
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      toast.success(fill(strings.removedToast, { name: setting.name }));
      router.refresh();
    });
  }

  return (
    <article
      aria-labelledby={`${formId}-name`}
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            id={`${formId}-name`}
            className="flex flex-wrap items-center gap-2 font-display text-base font-bold text-navy-900"
          >
            {setting.name}
            {setting.custom ? <Badge variant="neutral">{strings.custom}</Badge> : null}
          </h3>
          <p className="mt-0.5 text-sm text-mist-600">{definition.summary}</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Badge variant={setting.isActive ? "success" : "neutral"}>
              {setting.isActive ? strings.statusActive : strings.statusOff}
            </Badge>
          </li>
          <li>
            <Badge variant={setting.isLive ? "warning" : "brand"}>
              {setting.isLive ? strings.modeLive : strings.modeSandbox}
            </Badge>
          </li>
        </ul>
      </header>

      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist-700"
        aria-label={strings.environment}
      >
        {(["sandbox", "production"] as const).map((env) => {
          const saved = connections.some((item) => item.environment === env);
          const label = env === "production" ? strings.production : strings.sandbox;
          return (
            <li key={env}>
              <span className="font-semibold text-navy-900">{label}:</span>{" "}
              {saved ? strings.connected : strings.notConnected}
              {env === inUse ? <span className="text-mist-500"> ({strings.inUse})</span> : null}
            </li>
          );
        })}
      </ul>

      <ProviderSettingsForm
        key={`${setting.isActive}-${setting.isLive}-${setting.markupType}-${setting.markupValue}`}
        setting={setting}
        strings={strings}
      />

      <div className="flex flex-wrap gap-2">
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
        {setting.custom ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger-600"
            loading={removing}
            onClick={removeCustom}
          >
            {strings.removeProvider}
          </Button>
        ) : null}
      </div>

      {open ? (
        <CredentialsForm
          formId={formId}
          definition={definition}
          connections={connections}
          inUse={inUse}
          canSaveSecrets={canSaveSecrets}
          strings={strings}
        />
      ) : null}
    </article>
  );
}

export { ProviderCard };
