import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Info } from "@/components/icons/server/Info";
import { KeyRound } from "@/components/icons/server/KeyRound";
import {
  SUPPLIER_KINDS,
  type IntegrationSettingView,
  type ProviderConnectionView,
  type ProviderDefinition,
  type ProviderKind,
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
 * The tabs (issues 107 and 284): every outside service grouped by what it does; only supplier kinds take custom
 * providers. Sign-in holds Google and the robot check.
 */
const TABS: Array<{
  id:
    | "signin"
    | "communication"
    | "measurement"
    | "operations"
    | "payment"
    | "courier"
    | "flight"
    | "hotel";
  kinds: ProviderKind[];
}> = [
  { id: "signin", kinds: ["auth", "captcha"] },
  { id: "communication", kinds: ["email", "sms", "alerts"] },
  { id: "measurement", kinds: ["analytics"] },
  { id: "operations", kinds: ["monitoring", "storage"] },
  { id: "payment", kinds: ["payment"] },
  { id: "courier", kinds: ["courier"] },
  { id: "flight", kinds: ["flight"] },
  { id: "hotel", kinds: ["hotel"] },
];
const SUPPLIER = new Set<ProviderKind>(SUPPLIER_KINDS);

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
    keysLink: t("keysLink"),
    newTab: t("newTab"),
    status: {
      off: t("status.off"),
      notConnected: t("status.notConnected"),
      notTested: t("status.notTested"),
      connected: t("status.connected"),
      failing: t("status.failing"),
    },
    failingDetail: t("failingDetail", { message: "{message}", time: "{time}" }),
    changedBy: t("changedBy", { name: "{name}", time: "{time}" }),
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
      <Tabs defaultValue="signin" className="flex min-w-0 flex-col gap-5">
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
            {tab.kinds.some((kind) => SUPPLIER.has(kind)) ? (
              <AddProviderForm
                kinds={tab.kinds
                  .filter((kind): kind is (typeof SUPPLIER_KINDS)[number] => SUPPLIER.has(kind))
                  .map((kind) => ({ kind, label: t(`kinds.${kind}`) }))}
                strings={addStrings}
              />
            ) : tab.id === "signin" ? (
              <Alert variant="info">
                <Info aria-hidden="true" />
                <AlertDescription className="break-words">
                  {t("signInNote", { callback: absoluteUrl(GOOGLE_CALLBACK_PATH) })}
                </AlertDescription>
              </Alert>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </SettingsFrame>
  );
}

/**
 * Admin › Settings › Integrations (issues 82, 107 and 284): every outside service as a card, grouped in tabs; Super
 * Admin only.
 */
export default function IntegrationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Integrations />
    </Suspense>
  );
}
