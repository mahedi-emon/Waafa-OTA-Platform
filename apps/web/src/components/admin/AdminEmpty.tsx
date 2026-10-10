import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type AdminEmptyProps = { title: string; body?: string; action?: ReactNode };

/** Empty state for admin lists (AdminLeads "No leads match"). */
function AdminEmpty({ title, body, action }: AdminEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-mist-100 text-mist-600">
        <Inbox aria-hidden="true" className="size-6" />
      </span>
      <p className="font-display text-[17px] font-bold text-navy-900">{title}</p>
      {body ? <p className="max-w-sm text-[14px] text-mist-600">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { AdminEmpty };
