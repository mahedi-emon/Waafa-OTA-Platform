"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { MARKUP_KINDS, type IntegrationSettingView, type MarkupType } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from "@/i18n/navigation";
import { saveIntegrationSetting } from "@/lib/admin/providerActions";
import { fill, type IntegrationStrings } from "./integrationStrings";

type ProviderSettingsFormProps = {
  /** No Sandbox for this service: the Live switch is left out (issue 284). */
  liveOnly?: boolean;
  setting: IntegrationSettingView;
  strings: IntegrationStrings;
};

/**
 * Provider switches (issue 107): Active, Sandbox or Live credentials, and for flights and hotels the markup or commission
 * on net fares. The API refuses to turn a provider on without saved credentials for the chosen mode.
 */
function ProviderSettingsForm({ setting, liveOnly = false, strings }: ProviderSettingsFormProps) {
  const id = useId();
  const router = useRouter();
  const [isActive, setActive] = useState(setting.isActive);
  const [isLive, setLive] = useState(setting.isLive);
  const [markupType, setMarkupType] = useState<MarkupType>(setting.markupType);
  const [markupValue, setMarkupValue] = useState(
    setting.markupType === "none" ? "" : String(setting.markupValue),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const markupAllowed = MARKUP_KINDS.includes(setting.kind);
  const changed =
    isActive !== setting.isActive ||
    isLive !== setting.isLive ||
    markupType !== setting.markupType ||
    (markupType !== "none" && Number(markupValue) !== setting.markupValue);

  function save() {
    const value = markupType === "none" ? 0 : Number(markupValue);
    startTransition(async () => {
      const result = await saveIntegrationSetting(setting.provider, {
        isActive,
        isLive,
        markupType,
        markupValue: Number.isFinite(value) ? value : -1,
      });
      if (!result.ok) {
        const message =
          result.problem.fields?.[0]?.message ?? result.problem.detail ?? strings.failed;
        setError(result.problem.detail ?? message);
        toast.error(result.problem.detail ?? message);
        return;
      }
      setError(null);
      toast.success(fill(strings.settingSaved, { name: setting.name }));
      router.refresh();
    });
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-4 rounded-xl bg-mist-25 p-4 ring-1 ring-mist-100"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-start gap-3">
          <Switch
            id={`${id}-active`}
            checked={isActive}
            onCheckedChange={setActive}
            aria-describedby={`${id}-active-hint`}
          />
          <div className="min-w-0">
            <Label htmlFor={`${id}-active`}>{strings.active}</Label>
            <p id={`${id}-active-hint`} className="text-sm text-mist-600">
              {strings.activeHint}
            </p>
          </div>
        </div>
        {liveOnly ? null : (
          <div className="flex items-start gap-3">
            <Switch
              id={`${id}-live`}
              checked={isLive}
              onCheckedChange={setLive}
              aria-describedby={`${id}-live-hint`}
            />
            <div className="min-w-0">
              <Label htmlFor={`${id}-live`}>{strings.live}</Label>
              <p id={`${id}-live-hint`} className="text-sm text-mist-600">
                {strings.liveHint}
              </p>
            </div>
          </div>
        )}
      </div>

      {markupAllowed ? (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-navy-900">{strings.markup}</legend>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              variant="chip"
              value={markupType}
              onValueChange={(next) => {
                if (next === "none" || next === "percentage" || next === "fixed")
                  setMarkupType(next);
              }}
              className="max-w-full"
            >
              <ToggleGroupItem value="none">{strings.markupNone}</ToggleGroupItem>
              <ToggleGroupItem value="percentage">{strings.markupPercentage}</ToggleGroupItem>
              <ToggleGroupItem value="fixed">{strings.markupFixed}</ToggleGroupItem>
            </ToggleGroup>
            {markupType === "none" ? null : (
              <div className="flex items-center gap-2">
                <Label htmlFor={`${id}-markup`} className="sr-only">
                  {strings.markupValue}
                </Label>
                <span aria-hidden="true" className="text-sm font-semibold text-mist-600">
                  {markupType === "fixed" ? "৳" : null}
                </span>
                <Input
                  id={`${id}-markup`}
                  inputMode="decimal"
                  className="w-28 tabular-nums"
                  value={markupValue}
                  aria-describedby={`${id}-markup-hint`}
                  onChange={(event) => setMarkupValue(event.target.value.replace(/[^\d.]/g, ""))}
                />
                <span aria-hidden="true" className="text-sm font-semibold text-mist-600">
                  {markupType === "percentage" ? "%" : null}
                </span>
              </div>
            )}
          </div>
          {markupType === "none" ? null : (
            <p id={`${id}-markup-hint`} className="text-sm text-mist-600">
              {markupType === "percentage" ? strings.markupPercentHint : strings.markupFixedHint}
            </p>
          )}
        </fieldset>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="sm"
        className="w-fit"
        loading={pending}
        disabled={pending || !changed}
      >
        {strings.saveSetting}
      </Button>
    </form>
  );
}

export { ProviderSettingsForm };
