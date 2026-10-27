import type { ComponentProps } from "react";
import { formatDate, type AccountView } from "@waafa/shared";
import { ChevronDownIcon as ChevronDown } from "@/components/icons/server/ChevronDownIcon";
import { RequestProgress } from "@/components/track/RequestProgress";

type AccountRequestCardProps = {
  request: AccountView["requests"][number];
  moduleLabel: string;
  statusLabel: string;
  sentLabel: string;
  showProgress: string;
  heading: string;
  labels: ComponentProps<typeof RequestProgress>["labels"];
};

const chip =
  "inline-flex items-center rounded-full bg-electric-50 px-2.5 py-1 text-[12.5px] font-semibold text-navy-900";

/** One request or visa application in My account, with its timeline behind "Show progress" (issue 278). */
function AccountRequestCard({
  request,
  moduleLabel,
  statusLabel,
  sentLabel,
  showProgress,
  heading,
  labels,
}: AccountRequestCardProps) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-mist-600">
          {moduleLabel} ·{" "}
          <span className="font-mono text-ink-900 tabular-nums">{request.reference}</span>
        </span>
        <span className={chip}>{statusLabel}</span>
      </div>
      <p className="text-[15.5px] font-semibold break-words text-navy-900">{request.summary}</p>
      <p className="text-[13px] text-mist-600">
        {sentLabel.replace("{date}", formatDate(request.createdAt))}
      </p>
      <details className="group border-t border-mist-100 pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-[14px] font-semibold text-brand-700 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
          {showProgress}
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="pt-2">
          <RequestProgress
            request={{ ...request, kind: "request" }}
            heading={heading}
            labels={labels}
          />
        </div>
      </details>
    </li>
  );
}

export { AccountRequestCard };
