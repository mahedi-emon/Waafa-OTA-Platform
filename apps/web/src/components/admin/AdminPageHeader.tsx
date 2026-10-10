import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

type AdminPageHeaderProps = {
  title: ReactNode;
  lead?: ReactNode;
  /** A link back up (for detail pages). */
  back?: { href: string; label: string };
  actions?: ReactNode;
};

/** Page title row for every admin page: back link, title, one-line lead and actions on the right. */
function AdminPageHeader({ title, lead, back, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            prefetch={false}
            className="mb-2 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-brand-700 hover:underline md:min-h-0"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-900 md:text-[30px]">
          {title}
        </h1>
        {lead ? <p className="mt-1.5 max-w-3xl text-[15px] text-mist-600">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { AdminPageHeader };
