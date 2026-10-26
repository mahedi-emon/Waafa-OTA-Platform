import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Info } from "@/components/icons/server/Info";
import { KeyRound } from "@/components/icons/server/KeyRound";
import type {
  IntegrationSettingView,
  ProviderConnectionView,
  ProviderDefinition,
  ProviderKind,
} from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GOOGLE_CALLBACK_PATH } from "@/lib/account/googleOAuth";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { absoluteUrl } from "@/lib/siteUrl";
import { AddProviderForm } from "./_components/AddProviderForm";
import type { IntegrationStrings } from "./_components/integrationStrings";
import { ProviderCard } from "./_components/ProviderCard";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";

type ProvidersList = {
  encryptionReady: boolean;
  catalog: ProviderDefinition[];
  settings: IntegrationSettingView[];
  connections: ProviderConnectionView[];
};

/**
 * The tabs (owner request, issue 107): SMS and email share Communication; Sign-in holds Google (issue 134) and takes
 * no custom providers.
 */
const TABS: Array<{
  id: "flight" | "hotel" | "payment" | "communication" | "signin";
  kinds: ProviderKind[];
  custom: boolean;
}> = [
  { id: "flight", kinds: ["flight"], custom: true },
  { id: "hotel", kinds: ["hotel"], custom: true },
  { id: "payment", kinds: ["payment"], custom: true },
  { id: "communication", kinds: ["sms", "email"], custom: true },
  { id: "signin", kinds: ["auth"], custom: false },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.integrations");
  return { title: t("metaTitle") };
}

async function Integrations() {
  const [staff, t, tc, tf] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.integrations"),
    getTranslations("Admin.common"),
    getTranslations("Admin.forbidden"),
  ]);
  if (!hasRole(staff, "super-admin")) {
    return <AdminPageHeader title={tf("title")} lead={tf("body")} />;
  }
  const data = await adminGet<ProvidersList>("/admin/providers");
  // Placeholders stay in the strings; the cards fill them in (messages are precompiled, so no t.raw).
  const strings: IntegrationStrings = {
    environment: t("environment"),
    sandbox: t("sandbox"),
    production: t("production"),
    notConnected: t("notConnected"),
    connected: t("connected"),
    inUse: t("inUse"),
    custom: t("custom"),
    statusActive: t("statusActive"),
    statusOff: t("statusOff"),
    modeSandbox: t("modeSandbox"),
    modeLive: t("modeLive"),
    active: t("active"),
    activeHint: t("activeHint"),
    live: t("live"),
    liveHint: t("liveHint"),
    markup: t("markup"),
    markupNone: t("markupNone"),
    markupPercentage: t("markupPercentage"),
    markupFixed: t("markupFixed"),
    markupValue: t("markupValue"),
    markupPercentHint: t("markupPercentHint"),
    markupFixedHint: t("markupFixedHint"),
    saveSetting: t("saveSetting"),
    settingSaved: t("settingSaved", { name: "{name}" }),
    credentials: t("credentials"),
    secretSaved: t("secretSaved", { last4: "{last4}" }),
    secretSavedShort: t("secretSavedShort"),
    show: t("show", { field: "{field}" }),
    hide: t("hide", { field: "{field}" }),
    reveal: t("reveal"),
    revealHint: t("revealHint"),
    revealedLabel: t("revealedLabel", { field: "{field}" }),
    optional: t("optional"),
    connect: t("connect"),
    manage: t("manage"),
    close: t("close"),
    test: t("test"),
    remove: t("remove"),
    removeConfirm: t("removeConfirm", { name: "{name}", environment: "{environment}" }),
    removeProvider: t("removeProvider"),
    removeProviderConfirm: t("removeProviderConfirm", { name: "{name}" }),
    savedToast: t("savedToast", { name: "{name}" }),
    removedToast: t("removedToast", { name: "{name}" }),
    healthOk: t("healthOk"),
    healthFail: t("healthFail"),
    neverTested: t("neverTested"),
    note: t("note"),
    updated: t("updated", { time: "{time}", name: "{name}" }),
    save: tc("save"),
    failed: tc("failed"),
  };
  const addStrings = {
    title: t("add.title"),
    hint: t("add.hint"),
    name: t("add.name"),
    namePlaceholder: t("add.namePlaceholder"),
    kind: t("add.kind"),
    submit: t("add.submit"),
    added: t("add.added", { name: "{name}" }),
    failed: tc("failed"),
  };
  const settingFor = (definition: ProviderDefinition): IntegrationSettingView =>
    data.settings.find((item) => item.provider === definition.id) ?? {
      provider: definition.id,
      kind: definition.kind,
      name: definition.name,
      custom: false,
      isActive: false,
      isLive: false,
      markupType: "none",
      markupValue: 0,
      updatedBy: null,
      updatedAt: null,
    };

  return (
    <SettingsFrame current="integrations">
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="flex flex-col gap-3">
        {data.encryptionReady ? null : (
          <Alert variant="warning">
            <KeyRound aria-hidden="true" />
            <AlertDescription>{t("noKey")}</AlertDescription>
          </Alert>
        )}
        <Alert variant="info">
          <Info aria-hidden="true" />
          <AlertDescription>{t("liveNote")}</AlertDescription>
        </Alert>
      </div>
      <Tabs defaultValue="flight" className="flex min-w-0 flex-col gap-5">
        <TabsList aria-label={t("tabsLabel")} className="w-full max-w-2xl overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {t(`tabs.${tab.id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="flex min-w-0 flex-col gap-6">
            {tab.kinds.map((kind) => {
              const definitions = data.catalog.filter((item) => item.kind === kind);
              return (
                <section
                  key={kind}
                  aria-labelledby={`integrations-${kind}`}
                  className="flex min-w-0 flex-col gap-3"
                >
                  <h2
                    id={`integrations-${kind}`}
                    className="font-display text-lg font-bold text-navy-900"
                  >
                    {t(`kinds.${kind}`)}
                  </h2>
                  {definitions.length === 0 ? (
                    <p className="text-sm text-mist-600">{t("empty")}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {definitions.map((definition) => (
                        <ProviderCard
                          key={definition.id}
                          definition={definition}
                          setting={settingFor(definition)}
                          connections={data.connections.filter(
                            (item) => item.provider === definition.id,
                          )}
                          canSaveSecrets={data.encryptionReady}
                          strings={strings}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
            {tab.custom ? (
              <AddProviderForm
                kinds={tab.kinds
                  .filter((kind): kind is Exclude<ProviderKind, "auth"> => kind !== "auth")
                  .map((kind) => ({ kind, label: t(`kinds.${kind}`) }))}
                strings={addStrings}
              />
            ) : (
              <Alert variant="info">
                <Info aria-hidden="true" />
                <AlertDescription className="break-words">
                  {t("signInNote", { callback: absoluteUrl(GOOGLE_CALLBACK_PATH) })}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </SettingsFrame>
  );
}

/**
 * Admin › Settings › Integrations (issues 82 and 107): flight, hotel, payment, SMS and email APIs in four tabs, Super Admin
 * only.
 */
export default function IntegrationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Integrations />
    </Suspense>
  );
}
