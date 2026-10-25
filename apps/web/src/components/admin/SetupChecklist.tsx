import { ChevronRight, CircleCheck, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import { Link } from "@/i18n/navigation";
import type { SetupStep } from "@/lib/admin/setupChecklist";
import { AdminPanel } from "./AdminPanel";
import { ProgressRing } from "./ProgressRing";

type SetupChecklistProps = { steps: readonly SetupStep[]; className?: string };

/**
 * The setup checklist (ADMIN.md §5.2): each step ticks itself from the settings and links to where it is done. Steps
 * still open come first; once every step is done the card says so in one line.
 */
async function SetupChecklist({ steps, className }: SetupChecklistProps) {
  if (steps.length === 0) return null;
  const t = await getTranslations("Admin.setup");
  const done = steps.filter((step) => step.done).length;
  const ordered = steps.toSorted((a, b) => Number(a.done) - Number(b.done));

  return (
    <AdminPanel
      id="setup-checklist"
      className={className}
      title={t("title")}
      lead={done === steps.length ? t("allDone") : t("lead")}
      action={
        <ProgressRing
          value={done}
          total={steps.length}
          label={t("progress", { done, total: steps.length })}
        />
      }
      flush
    >
      <ul className="divide-y divide-mist-100 border-t border-mist-100">
        {ordered.map((step) => {
          const Icon = step.done ? CircleCheck : Circle;
          const body = (
            <>
              <Icon
                aria-hidden="true"
                className={cn("size-5 shrink-0", step.done ? "text-success-600" : "text-mist-400")}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn("font-semibold", step.done ? "text-mist-600" : "text-navy-900")}
                >
                  {t(`steps.${step.id}.title`)}
                  <span className="sr-only"> ({step.done ? t("doneWord") : t("openWord")})</span>
                </span>
                {step.done ? null : (
                  <span className="text-[13.5px] leading-snug text-mist-600">
                    {t(`steps.${step.id}.body`)}
                  </span>
                )}
              </span>
            </>
          );
          return (
            <li key={step.id}>
              {step.href && !step.done ? (
                <Link
                  href={step.href}
                  prefetch={false}
                  className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-mist-25 focus-visible:bg-electric-50 focus-visible:outline-none motion-reduce:transition-none"
                >
                  {body}
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-mist-400" />
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 px-5 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </AdminPanel>
  );
}

export { SetupChecklist };
