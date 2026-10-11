import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Info, KeyRound } from "lucide-react";
import {
  ProviderKindSchema,
  type ProviderConnectionView,
  type ProviderDefinition,
} from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { ProviderCard, type ProviderCardStrings } from "./_components/ProviderCard";

type ProvidersList = {
  encryptionReady: boolean;
  catalog: ProviderDefinition[];
  connections: ProviderConnectionView[];
};

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
  // Placeholders stay in the strings; the card fills them in (messages are precompiled, issue 91).
  const strings: ProviderCardStrings = {
    environment: t("environment"),
    sandbox: t("sandbox"),
    production: t("production"),
    notConnected: t("notConnected"),
    connected: t("connected"),
    off: t("off"),
    enabled: t("enabled"),
    enabledHint: t("enabledHint"),
    secretSaved: t("secretSaved", { last4: "{last4}" }),
    secretSavedShort: t("secretSavedShort"),
    optional: t("optional"),
    connect: t("connect"),
    manage: t("manage"),
    close: t("close"),
    test: t("test"),
    remove: t("remove"),
    removeConfirm: t("removeConfirm", { name: "{name}", environment: "{environment}" }),
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

  return (
    <>
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
      {ProviderKindSchema.options.map((kind) => {
        const definitions = data.catalog.filter((item) => item.kind === kind);
        if (definitions.length === 0) return null;
        return (
          <section
            key={kind}
            aria-labelledby={`integrations-${kind}`}
            className="flex flex-col gap-3"
          >
            <h2
              id={`integrations-${kind}`}
              className="font-display text-lg font-bold text-navy-900"
            >
              {t(`kinds.${kind}`)}
            </h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {definitions.map((definition) => (
                <ProviderCard
                  key={definition.id}
                  definition={definition}
                  connections={data.connections.filter((item) => item.provider === definition.id)}
                  canSaveSecrets={data.encryptionReady}
                  strings={strings}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

/** Admin › Settings › Integrations (#82): flight, hotel and payment API connections, Super Admin only. */
export default function IntegrationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Integrations />
    </Suspense>
  );
}
