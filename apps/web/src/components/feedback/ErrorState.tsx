import { CircleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type ErrorStateProps = {
  title: string;
  /** Say what went wrong and how to fix it; never apologise, never be vague. */
  description: string;
  /** Usually a "Try again" button; add a call or WhatsApp link where a person can help. */
  action?: ReactNode;
  className?: string;
};

/** Error state (FR-GLB-06): same shape as the empty state, danger tone, announced to screen readers. */
function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <Empty role="alert" className={className}>
      <EmptyHeader>
        <EmptyMedia className="text-danger-600">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export { ErrorState };
