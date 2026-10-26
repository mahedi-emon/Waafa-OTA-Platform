import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  StaffLoginResultSchema,
  type StaffLoginEvent,
  type StaffLoginResult,
  type TwoStepStatus,
} from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LoginHistory } from "@/components/admin/twoStep/LoginHistory";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { dhakaDay, formatPlainDate } from "@/lib/admin/format";
import { PasswordForm } from "./_components/PasswordForm";
import { TwoStepPanel } from "./_components/TwoStepPanel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.account");
  return { title: t("metaTitle") };
}

/** My account: password, two-step sign-in and recent sign-ins (issue 234). */
export default async function AccountPage() {
  const [staff, t, tc, ts, tl, tsi, status, events] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.account"),
    getTranslations("Admin.common"),
    getTranslations("Admin.twoStep"),
    getTranslations("Admin.loginResult"),
    getTranslations("Admin.signIn"),
    adminGet<TwoStepStatus>("/auth/two-step"),
    adminGet<StaffLoginEvent[]>("/auth/logins"),
  ]);
  const resultLabels = Object.fromEntries(
    StaffLoginResultSchema.options.map((result) => [result, tl(result)]),
  ) as Record<StaffLoginResult, string>;
  const enabledOn = status.enabledAt ? formatPlainDate(dhakaDay(status.enabledAt)) : "";

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="flex flex-col gap-5">
        <AdminPanel>
          <TwoStepPanel
            status={status}
            email={staff.email}
            strings={{
              title: t("twoStepTitle"),
              onLead: t("twoStepOnLead", { date: enabledOn }),
              offLead: t("twoStepOffLead"),
              required: t("twoStepRequired"),
              on: t("on"),
              off: t("off"),
              recoveryLeft: t("recoveryLeft", { count: status.recoveryCodesLeft }),
              trustedDevices: t("trustedDevices", { count: status.trustedDevices }),
              turnOn: t("turnOn"),
              setupScan: t("setupScan"),
              setupKey: t("setupKey"),
              setupCode: t("setupCode"),
              setupConfirm: t("setupConfirm"),
              setupDone: t("setupDone"),
              newCodes: t("newCodes"),
              newCodesLead: t("newCodesLead"),
              makeCodes: t("makeCodes"),
              codesMade: t("codesMade"),
              turnOff: t("turnOff"),
              turnOffLead: t("turnOffLead"),
              turnedOff: t("turnedOff"),
              wrongCode: t("wrongCode"),
              expiredSetup: t("expiredSetup"),
              password: t("current"),
              wrongPassword: t("wrong"),
              cancel: t("cancel"),
              failed: tc("unavailable"),
              qrLabel: tsi("qrLabel"),
              savedTitle: tsi("savedTitle"),
              savedLead: tsi("savedLead"),
              done: t("codesDone"),
              codes: {
                codesLabel: ts("codesLabel"),
                copy: ts("copy"),
                copied: ts("copied"),
                download: ts("download"),
                fileName: ts("fileName"),
                fileTitle: ts("fileTitle"),
                fileNote: ts("fileNote"),
              },
            }}
          />
        </AdminPanel>
        <AdminPanel id="account-password" title={t("passwordTitle")} lead={t("passwordLead")}>
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
        <AdminPanel id="account-history" title={t("historyTitle")} lead={t("historyLead")}>
          <LoginHistory
            events={events.slice(0, 10)}
            resultLabels={resultLabels}
            newDeviceLabel={t("newDevice")}
            emptyLabel={t("historyEmpty")}
          />
        </AdminPanel>
      </div>
    </>
  );
}
