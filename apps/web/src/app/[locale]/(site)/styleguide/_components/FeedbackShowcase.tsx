"use client";

import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  SearchXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatTaka } from "@waafa/shared";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/** Notices, toasts, skeletons, empty and error states (Components board, States board). */
function FeedbackShowcase() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="grid gap-3">
        <Alert variant="info">
          <InfoIcon />
          <AlertDescription>
            Fares shown are indicative. Our team confirms the final price before you pay.
          </AlertDescription>
        </Alert>
        <Alert variant="success">
          <CircleCheckIcon />
          <AlertDescription>
            Payment proof received. Accounts will verify it within one working day.
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertDescription>
            Your passport expires within 6 months of travel. Most countries will refuse entry.
          </AlertDescription>
        </Alert>
        <Alert variant="danger">
          <CircleAlertIcon />
          <AlertDescription>
            We couldn’t send your query. Check your connection and try again; nothing you typed is
            lost.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid content-start gap-3">
        <p className="type-caption text-mist-600">
          Toasts (bottom right on desktop, above the tab bar on phones)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.success("Added to cart", {
                description: "HP 83A toner",
                action: { label: "View cart", onClick: () => undefined },
              })
            }
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.error("Couldn’t send your request", {
                description: "Your details are kept. Check the connection and try again.",
                duration: Number.POSITIVE_INFINITY,
                action: { label: "Try again", onClick: () => undefined },
              })
            }
          >
            Error toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.info("Price updated", {
                description: `The airline changed the fare to ${formatTaka(58900)}. Your expert will confirm.`,
              })
            }
          >
            Info toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.warning("You’re offline. We’ll send this when you’re back.")}
          >
            Warning toast
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm text-mist-600">
          <Spinner className="text-electric-600" /> Inline spinner, 18 px, for buttons only
        </div>
        <Progress value={62} aria-label="Upload progress" className="mt-2" />
      </div>

      <div className="grid content-start items-start gap-4 sm:grid-cols-2">
        {[0, 1].map((card) => (
          <div key={card} className="grid gap-3 rounded-lg border border-mist-200 p-3">
            <Skeleton className="aspect-[4/3] w-full rounded-md" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-[38px] w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        <EmptyState
          icon={SearchXIcon}
          title="No packages match"
          description="Try fewer filters, or tell us the trip you want."
          action={<Button variant="secondary">Clear filters</Button>}
        />
        <ErrorState
          title="We couldn’t load the fares"
          description="The connection dropped. Your search is saved; try again in a moment."
          action={<Button>Try again</Button>}
        />
      </div>
    </div>
  );
}

export { FeedbackShowcase };
