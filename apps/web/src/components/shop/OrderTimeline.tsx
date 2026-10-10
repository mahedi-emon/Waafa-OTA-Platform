import { Check } from "lucide-react";
import { cn } from "cn";
import { formatDate, formatTime, type Order, type OrderStatus } from "@waafa/shared";

type OrderTimelineProps = {
  history: Order["history"];
  status: OrderStatus;
  labels: Record<OrderStatus, string>;
  heading: string;
  courier: string;
  trackingNumber: string;
};

/** The forward path of an order; cancelled and returned orders show only their own history. */
const PATH: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered"];

/** Order progress (ShopTrack): the steps reached with their time and notes, and the steps still to come. */
function OrderTimeline({
  history,
  status,
  labels,
  heading,
  courier,
  trackingNumber,
}: OrderTimelineProps) {
  const reached = new Map(history.map((entry) => [entry.status, entry]));
  const forward = PATH.includes(status);
  const steps: OrderStatus[] = forward
    ? PATH
    : [...new Set([...PATH.filter((step) => reached.has(step)), status])];

  return (
    <section aria-label={heading}>
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const entry = reached.get(step);
          const current = step === status;
          return (
            <li key={step} className="relative flex gap-3.5 pb-6 last:pb-0">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-8 bottom-0 left-[13px] w-0.5",
                    entry && reached.has(steps[index + 1]!) ? "bg-electric-600" : "bg-mist-200",
                  )}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
                  entry
                    ? "border-electric-600 bg-electric-600 text-white"
                    : "border-mist-300 bg-white text-transparent",
                  current && "ring-4 ring-electric-600/20",
                )}
              >
                <Check className="size-3.5" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "text-[15px] font-semibold",
                    entry ? "text-navy-900" : "text-mist-500",
                  )}
                >
                  {labels[step]}
                </p>
                {entry ? (
                  <p className="text-[13px] text-mist-700 tabular-nums">
                    {formatDate(entry.at)}, {formatTime(entry.at)}
                  </p>
                ) : null}
                {entry?.note ? <p className="text-[13.5px] text-ink-900">{entry.note}</p> : null}
                {entry?.courier || entry?.trackingNumber ? (
                  <p className="text-[13.5px] text-ink-900">
                    {entry.courier ? `${courier}: ${entry.courier}` : null}
                    {entry.courier && entry.trackingNumber ? " · " : null}
                    {entry.trackingNumber ? `${trackingNumber}: ${entry.trackingNumber}` : null}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export { OrderTimeline };
