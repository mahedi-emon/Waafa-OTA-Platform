import "server-only";
import { getTranslations } from "next-intl/server";
import type { ReminderFormStrings } from "@/components/admin/reminders/ReminderForm";
import type { ReminderStrings } from "@/components/admin/reminders/ReminderItems";

/** The reminder list's and form's words from Admin.reminders (issue 243), resolved on the server for client props. */
export async function reminderStrings(): Promise<{
  list: ReminderStrings;
  form: ReminderFormStrings;
}> {
  const t = await getTranslations("Admin.reminders");
  return {
    list: {
      overdue: t("overdue"),
      today: t("today"),
      later: t("later"),
      done: t("done"),
      snooze: t("snooze"),
      remove: t("remove"),
      failed: t("failed"),
      doneToast: t("doneToast"),
      snoozed: t("snoozed"),
      removed: t("removed"),
      empty: t("empty"),
    },
    form: {
      note: t("note"),
      notePlaceholder: t("notePlaceholder"),
      when: t("when"),
      inHour: t("inHour"),
      inThreeHours: t("inThreeHours"),
      tomorrowMorning: t("tomorrowMorning"),
      custom: t("custom"),
      customLabel: t("customLabel"),
      submit: t("submit"),
      added: t("added"),
      failed: t("failed"),
      past: t("past"),
    },
  };
}
