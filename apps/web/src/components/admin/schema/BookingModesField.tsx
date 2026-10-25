"use client";

import { useTranslations } from "next-intl";
import { Lock, UserCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Path } from "@/lib/admin/schema";
import { fieldId } from "./fieldIds";
import { useSchemaEditor } from "./useSchemaEditor";

type BookingModesFieldProps = { path: Path; value: unknown };

type ModuleMode = { module?: string; mode?: string; liveLocked?: boolean; lockReason?: string };

/**
 * Booking modes as one card per service (issue 229, PRD §12 Golden Switch): how it books today, whether Live is
 * locked and why. Live stays locked until the Phase E gate (FR-GS-04), so the only thing staff edit here is the lock
 * reason the site shows; the mode itself is shown, never a switch that would always be refused.
 */
function BookingModesField({ path, value }: BookingModesFieldProps) {
  const editor = useSchemaEditor();
  const t = useTranslations("Admin.editor.widgets.bookingModes");
  // Labels come from the blueprint the server resolved (D194): the client has no Admin.choices words.
  const label = (field: "module" | "mode", value: string | undefined) =>
    editor.blueprint.fields[field]?.choices?.find((choice) => choice.value === value)?.label ??
    value ??
    "";
  const items = Array.isArray(value) ? (value as ModuleMode[]) : [];

  return (
    <ul className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
      {items.map((item, index) => {
        const reasonPath: Path = [...path, index, "lockReason"];
        const id = fieldId(reasonPath);
        const title = label("module", item.module);
        return (
          <li
            key={item.module ?? index}
            className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-[16px] font-bold text-navy-900">{title}</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[12.5px] font-semibold text-sky-700">
                <UserCheck aria-hidden="true" className="size-3.5" />
                {label("mode", item.mode)}
              </span>
            </div>
            {item.liveLocked ? (
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-mist-100 px-2.5 py-1 text-[12.5px] font-semibold text-mist-800">
                <Lock aria-hidden="true" className="size-3.5" />
                {t("locked")}
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-[13.5px] font-semibold text-navy-900">
                {t("reason")}
              </label>
              <Textarea
                id={id}
                rows={2}
                maxLength={200}
                value={item.lockReason ?? ""}
                aria-describedby={`${id}-help`}
                onChange={(event) => editor.change(reasonPath, event.target.value || undefined)}
                onBlur={() => editor.touch(reasonPath)}
              />
              <p id={`${id}-help`} className="text-[12.5px] text-mist-600">
                {t("reasonHelp")}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export { BookingModesField };
