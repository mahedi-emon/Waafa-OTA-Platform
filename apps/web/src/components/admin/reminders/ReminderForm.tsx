"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useRouter } from "@/i18n/navigation";
import { createReminder } from "@/lib/admin/alertActions";
import { dhakaFieldToIso, dhakaLocal, dueFor } from "@/lib/admin/reminderTimes";

export type ReminderFormStrings = {
  note: string;
  notePlaceholder: string;
  when: string;
  inHour: string;
  inThreeHours: string;
  tomorrowMorning: string;
  custom: string;
  customLabel: string;
  submit: string;
  added: string;
  failed: string;
  past: string;
};

type When = "inHour" | "inThreeHours" | "tomorrowMorning" | "custom";

/** Sets a reminder for the signed-in person (issue 243), on a lead when `leadId` is given. */
function ReminderForm({ leadId, strings }: { leadId?: string; strings: ReminderFormStrings }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [when, setWhen] = useState<When>("tomorrowMorning");
  const [custom, setCustom] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    const dueAt = when === "custom" ? dhakaFieldToIso(custom) : dueFor(when, new Date());
    if (!dueAt || new Date(dueAt).getTime() < Date.now()) {
      toast.error(strings.past);
      return;
    }
    startTransition(async () => {
      const result = await createReminder({
        ...(leadId ? { leadId } : {}),
        note: note.trim(),
        dueAt,
      });
      if (!result.ok) {
        toast.error(result.problem.status === 400 ? strings.past : strings.failed);
        return;
      }
      toast.success(strings.added);
      setNote("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reminder-note">{strings.note}</Label>
        <Input
          id="reminder-note"
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder={strings.notePlaceholder}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reminder-when">{strings.when}</Label>
          <NativeSelect
            id="reminder-when"
            value={when}
            onChange={(event) => {
              const next = event.target.value as When;
              setWhen(next);
              if (next === "custom" && !custom)
                setCustom(dhakaLocal(new Date(Date.now() + 3_600_000)));
            }}
          >
            <NativeSelectOption value="inHour">{strings.inHour}</NativeSelectOption>
            <NativeSelectOption value="inThreeHours">{strings.inThreeHours}</NativeSelectOption>
            <NativeSelectOption value="tomorrowMorning">
              {strings.tomorrowMorning}
            </NativeSelectOption>
            <NativeSelectOption value="custom">{strings.custom}</NativeSelectOption>
          </NativeSelect>
        </div>
        {when === "custom" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reminder-custom">{strings.customLabel}</Label>
            <Input
              id="reminder-custom"
              type="datetime-local"
              value={custom}
              min={dhakaLocal(new Date())}
              onChange={(event) => setCustom(event.target.value)}
            />
          </div>
        ) : null}
      </div>
      <div>
        <Button type="submit" size="sm" loading={pending} disabled={!note.trim()}>
          {strings.submit}
        </Button>
      </div>
    </form>
  );
}

export { ReminderForm };
