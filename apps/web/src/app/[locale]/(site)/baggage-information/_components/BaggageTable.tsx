"use client";

import { useDeferredValue, useId, useState } from "react";
import { Search } from "lucide-react";
import type { BaggageRule } from "@waafa/shared";
import { ChipRadioGroup } from "@/components/forms/ChipRadioGroup";

type Scope = BaggageRule["scope"];
type CabinClass = BaggageRule["cabinClass"];

type BaggageTableProps = {
  rules: Array<Omit<BaggageRule, "sample"> & { checkedLabel: string }>;
  labels: {
    search: string;
    scopeLabel: string;
    scopes: Record<Scope, string>;
    classLabel: string;
    classes: Record<CabinClass, string>;
    columns: { airline: string; cabin: string; checked: string; note: string };
    /** "{query}" is replaced. */
    noMatch: string;
    noRows: string;
  };
};

const CLASS_ORDER: CabinClass[] = ["economy", "premium-economy", "business", "first"];

/**
 * Allowance by airline (Baggage board): search by airline name or code, route (international or domestic) and cabin
 * class. A table from 768 px, stacked cards on phones (only one is ever shown, so screen readers hear it once).
 */
function BaggageTable({ rules, labels }: BaggageTableProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>(
    rules.some((rule) => rule.scope === "international") ? "international" : "domestic",
  );
  const classes = CLASS_ORDER.filter((value) =>
    rules.some((rule) => rule.scope === scope && rule.cabinClass === value),
  );
  const [cabin, setCabin] = useState<CabinClass>("economy");
  const activeClass = classes.includes(cabin) ? cabin : (classes[0] ?? "economy");
  const deferred = useDeferredValue(query);

  const wanted = deferred.trim().toLowerCase();
  const rows = rules
    .filter((rule) => rule.scope === scope && rule.cabinClass === activeClass)
    .filter(
      (rule) =>
        !wanted ||
        rule.airlineName.toLowerCase().includes(wanted) ||
        rule.airlineCode.toLowerCase() === wanted,
    )
    .sort((a, b) => a.airlineName.localeCompare(b.airlineName));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <p id={`${id}-scope`} className="text-[13px] font-semibold text-mist-700">
              {labels.scopeLabel}
            </p>
            <ChipRadioGroup
              labelledBy={`${id}-scope`}
              value={scope}
              onChange={(value) => setScope(value as Scope)}
              options={(["international", "domestic"] as const)
                .filter((value) => rules.some((rule) => rule.scope === value))
                .map((value) => ({ value, label: labels.scopes[value] }))}
            />
          </div>
          {classes.length > 1 ? (
            <div className="flex flex-col gap-1.5">
              <p id={`${id}-class`} className="text-[13px] font-semibold text-mist-700">
                {labels.classLabel}
              </p>
              <ChipRadioGroup
                labelledBy={`${id}-class`}
                value={activeClass}
                onChange={(value) => setCabin(value as CabinClass)}
                options={classes.map((value) => ({ value, label: labels.classes[value] }))}
              />
            </div>
          ) : null}
        </div>
        <div className="relative w-full lg:w-72">
          <label htmlFor={`${id}-search`} className="sr-only">
            {labels.search}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-mist-500"
          />
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            autoComplete="off"
            className="h-12 w-full rounded-full border border-mist-300 bg-white pr-4 pl-12 text-base outline-none placeholder:text-mist-500 focus-visible:border-electric-600 focus-visible:ring-4 focus-visible:ring-ring/15"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-dashed border-mist-300 bg-white p-5 text-[14.5px] text-mist-700"
        >
          {deferred.trim() ? labels.noMatch.replace("{query}", deferred.trim()) : labels.noRows}
        </p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-mist-200 bg-white md:block">
            <table className="w-full text-left text-[14.5px]">
              <thead className="bg-mist-50 text-[13px] font-semibold text-mist-700">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {labels.columns.airline}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {labels.columns.cabin}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {labels.columns.checked}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {labels.columns.note}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((rule) => (
                  <tr key={rule.id} className="border-t border-mist-100 align-top">
                    <th scope="row" className="px-4 py-3 font-semibold text-navy-900">
                      <span className="mr-2 inline-grid h-6 min-w-9 place-items-center rounded-md bg-navy-900 px-1.5 font-display text-[11.5px] tracking-wider text-white">
                        {rule.airlineCode}
                      </span>
                      {rule.airlineName}
                    </th>
                    <td className="px-4 py-3 text-ink-900">{rule.cabinAllowance}</td>
                    <td className="px-4 py-3 text-ink-900">{rule.checkedAllowance}</td>
                    <td className="px-4 py-3 text-mist-700">
                      {rule.notes ? <span className="block">{rule.notes}</span> : null}
                      <span className="text-[12.5px] text-mist-600">{rule.checkedLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((rule) => (
              <li key={rule.id} className="rounded-2xl border border-mist-200 bg-white p-4">
                <p className="flex items-center gap-2 font-semibold text-navy-900">
                  <span className="inline-grid h-6 min-w-9 place-items-center rounded-md bg-navy-900 px-1.5 font-display text-[11.5px] tracking-wider text-white">
                    {rule.airlineCode}
                  </span>
                  {rule.airlineName}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-[14px]">
                  <div>
                    <dt className="text-[12.5px] text-mist-600">{labels.columns.cabin}</dt>
                    <dd className="font-medium text-ink-900">{rule.cabinAllowance}</dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] text-mist-600">{labels.columns.checked}</dt>
                    <dd className="font-medium text-ink-900">{rule.checkedAllowance}</dd>
                  </div>
                </dl>
                {rule.notes ? (
                  <p className="mt-2 text-[13.5px] text-mist-700">{rule.notes}</p>
                ) : null}
                <p className="mt-1 text-[12.5px] text-mist-600">{rule.checkedLabel}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export { BaggageTable };
