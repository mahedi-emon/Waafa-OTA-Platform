import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { PasswordForm } from "./_components/PasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.account");
  return { title: t("metaTitle") };
}

/** My account: change my password. */
export default async function AccountPage() {
  const [t, tc] = await Promise.all([
    getTranslations("Admin.account"),
    getTranslations("Admin.common"),
  ]);
  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <AdminPanel>
        <PasswordForm
          strings={{
            current: t("current"),
            next: t("next"),
            nextHint: t("nextHint"),
            change: t("change"),
            changed: t("changed"),
            wrong: t("wrong"),
            failed: tc("unavailable"),
          }}
        />
      </AdminPanel>
    </>
  );
}
