"use client";

import { CircleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { pathFromDotted, patternOf } from "@/lib/admin/blueprints/paths";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import type { FieldError } from "@/lib/admin/blueprints/validate";
import { scrollToField } from "./scrollToSection";
import type { EditorNotice } from "./useEditorState";

type EditorNoticeBannerProps = {
  notice: EditorNotice;
  errors: ReadonlyMap<string, FieldError>;
  blueprint: ResolvedBlueprint;
  missing: string[];
  onRetry: () => void;
  onDismiss: () => void;
};

/**
 * What stopped a save, in plain words with the next step (ADMIN.md §9): the fields to fix (each a link to the
 * field), what Publish still needs, or a problem with a Retry.
 */
function EditorNoticeBanner({
  notice,
  errors,
  blueprint,
  missing,
  onRetry,
  onDismiss,
}: EditorNoticeBannerProps) {
  const t = useTranslations("Admin.editor");
  const te = useTranslations("Admin.editor.errors");
  const labelOf = (dotted: string) => {
    const path = pathFromDotted(dotted);
    const field = blueprint.fields[patternOf(path)];
    const row = path.findLast((part) => typeof part === "number");
    return `${field?.label ?? dotted}${typeof row === "number" ? ` (${row + 1})` : ""}`;
  };

  return (
    <div role="alert" className="rounded-2xl border border-danger-700/20 bg-danger-50 p-4">
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-700" />
        <div className="min-w-0 flex-1">
          {notice.kind === "fields" ? (
            <>
              <p className="text-[14.5px] font-semibold text-danger-700">
                {te("fields", { count: notice.count })}
              </p>
              <p className="mt-0.5 text-[13.5px] text-ink-900">{te("fieldsLead")}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {[...errors.entries()].slice(0, 8).map(([dotted, problem]) => (
                  <li key={dotted}>
                    <button
                      type="button"
                      onClick={() => scrollToField(dotted)}
                      className="cursor-pointer text-left text-[14px] text-danger-700 underline underline-offset-2 hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      {labelOf(dotted)}: {te(problem.code, problem.values ?? {})}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : notice.kind === "publish" ? (
            <>
              <p className="text-[14.5px] font-semibold text-danger-700">{t("side.checklist")}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {missing.map((label) => (
                  <li key={label} className="text-[14px] text-ink-900">
                    {t("side.missing", { field: label })}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[14.5px] font-semibold text-danger-700">{te(notice.code)}</p>
              {notice.code === "server" || notice.code === "offline" ? (
                <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
                  {te("retry")}
                </Button>
              ) : null}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("widgets.clear")}
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export { EditorNoticeBanner };
