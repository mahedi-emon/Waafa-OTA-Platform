import { cn } from "cn";
import type { LeadFact } from "@/lib/admin/leadFacts";

type LeadFactsProps = { facts: LeadFact[] };

/** A customer's request as labelled facts in two columns; long texts take the full width (no raw data on screen). */
function LeadFacts({ facts }: LeadFactsProps) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
      {facts.map((fact, index) => (
        <div key={`${fact.label}-${index}`} className={cn("min-w-0", fact.wide && "sm:col-span-2")}>
          <dt className="text-[12.5px] font-semibold text-mist-600">{fact.label}</dt>
          <dd className="mt-0.5 text-[14.5px] break-words whitespace-pre-line text-ink-900">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export { LeadFacts };
