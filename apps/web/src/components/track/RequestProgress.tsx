import { formatDate, type TrackedRequest } from "@waafa/shared";
import { cn } from "cn";
import { Check } from "@/components/icons/server/Check";

type Step = { key: string; label: string; done: boolean; date?: string | null };

type RequestProgressProps = {
  request: TrackedRequest;
  heading: string;
  labels: {
    received: string;
    expert: string;
    quote: string;
    booked: string;
    closed: string;
    documents: string;
    submitted: string;
    approved: string;
    rejected: string;
    passport: string;
    waiting: string;
    done: string;
  };
};

const CLOSED = ["cancelled", "lost", "spam"];
const QUOTED_OR_LATER = ["quoted", "booked"];

/** The steps a request (or a visa application) has passed, with their dates; the next step is marked as next. */
function stepsOf(request: TrackedRequest, labels: RequestProgressProps["labels"]): Step[] {
  const responded = request.respondedAt !== null || request.status !== "new";
  const steps: Step[] = [
    { key: "received", label: labels.received, done: true, date: request.createdAt },
    { key: "expert", label: labels.expert, done: responded, date: request.respondedAt },
  ];
  if (request.visa) {
    const { visa } = request;
    const submitted = visa.submittedOn !== null;
    const decided =
      visa.stage === "approved" || visa.stage === "rejected" || visa.stage === "passportReturned";
    steps.push(
      {
        key: "documents",
        label: labels.documents
          .replace("{received}", String(visa.received))
          .replace("{required}", String(visa.required)),
        done: visa.required > 0 && visa.received >= visa.required,
      },
      { key: "submitted", label: labels.submitted, done: submitted, date: visa.submittedOn },
      {
        key: "decision",
        label: visa.stage === "rejected" ? labels.rejected : labels.approved,
        done: decided,
      },
      {
        key: "passport",
        label: labels.passport,
        done: visa.passportReturnedOn !== null,
        date: visa.passportReturnedOn,
      },
    );
  } else {
    steps.push({
      key: "quote",
      label: labels.quote,
      done: QUOTED_OR_LATER.includes(request.status),
    });
    steps.push({
      key: "booked",
      label: labels.booked,
      done: request.status === "booked",
      date: request.status === "booked" ? request.closedAt : null,
    });
  }
  if (CLOSED.includes(request.status)) {
    steps.push({ key: "closed", label: labels.closed, done: true, date: request.closedAt });
  }
  return steps;
}

/** A request's or visa application's progress on /track (issue 240): ticks for done steps, "Next" on the first open one. */
function RequestProgress({ request, heading, labels }: RequestProgressProps) {
  const steps = stepsOf(request, labels);
  const next = steps.findIndex((step) => !step.done);

  return (
    <section aria-labelledby="request-progress" className="flex flex-col gap-4">
      <h3 id="request-progress" className="font-display text-[16px] font-bold text-navy-900">
        {heading}
      </h3>
      <ol className="flex flex-col gap-0">
        {steps.map((step, index) => (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 bottom-0 left-[13px] w-0.5",
                  step.done ? "bg-success-600" : "bg-mist-200",
                )}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative grid size-7 shrink-0 place-items-center rounded-full border-2",
                step.done
                  ? "border-success-600 bg-success-600 text-white"
                  : index === next
                    ? "border-electric-600 bg-white"
                    : "border-mist-300 bg-white",
              )}
            >
              {step.done ? <Check className="size-4" /> : null}
            </span>
            <span className="flex min-w-0 flex-col pt-0.5">
              <span
                className={cn(
                  "text-[15px] font-semibold",
                  step.done || index === next ? "text-navy-900" : "text-mist-600",
                )}
              >
                {step.label}
                <span className="sr-only">
                  {step.done ? ` (${labels.done})` : index === next ? ` (${labels.waiting})` : ""}
                </span>
              </span>
              {step.date ? (
                <span className="text-[13px] text-mist-600 tabular-nums">
                  {formatDate(step.date)}
                </span>
              ) : index === next ? (
                <span className="text-electric-700 text-[13px] font-semibold">
                  {labels.waiting}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export { RequestProgress };
