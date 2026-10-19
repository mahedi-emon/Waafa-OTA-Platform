import type { ReactNode } from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

type AdminPageHeaderProps = {
  title: ReactNode;
  /** One line: what this page is and where it shows on the website. */
  lead?: ReactNode;
  /** The parent list of a detail page; it becomes the breadcrumb before the title. */
  back?: { href: string; label: string };
  /** One primary action (secondary ones in a menu), on the right. */
  actions?: ReactNode;
  /** A status chip beside the title (records and work items). */
  status?: ReactNode;
  /** A quiet line under the lead, e.g. "Edited 5 min ago by Rafi". */
  meta?: ReactNode;
};

/**
 * The page header on every admin page (ADMIN.md §5.1): breadcrumbs, title (+ status), a one-line explanation and the
 * primary action, so each screen says what it is and what to do next.
 */
function AdminPageHeader({ title, lead, back, actions, status, meta }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2.5">
      <AdminBreadcrumbs back={back} current={typeof title === "string" ? title : undefined} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-display text-[24px] leading-tight font-extrabold text-navy-900 md:text-[28px]">
              {title}
            </h1>
            {status}
          </div>
          {lead ? (
            <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-mist-600">{lead}</p>
          ) : null}
          {meta ? <div className="mt-2 text-[13.5px] text-mist-600">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export { AdminPageHeader };
