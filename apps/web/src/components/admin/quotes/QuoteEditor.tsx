"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QUOTE_MAX_OPTIONS, type QuoteOption } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { createQuote, updateQuote } from "@/lib/admin/quoteActions";
import { TakaInput } from "../TakaInput";

type Draft = {
  key: number;
  title: string;
  details: string;
  baggage: string;
  price: number | undefined;
};

type QuoteEditorProps = {
  /** A new quote on this lead, or changes to this quote. */
  target: { leadId: string } | { quoteId: string };
  options: QuoteOption[];
  validUntil: string;
  notes: string | null;
  /** Today in Asia/Dhaka: the earliest last day. */
  today: string;
  labels: {
    title: string;
    lead: string;
    option: string;
    optionTitle: string;
    optionTitleHint: string;
    details: string;
    detailsHint: string;
    baggage: string;
    baggageHint: string;
    price: string;
    addOption: string;
    removeOption: string;
    validUntil: string;
    validUntilHint: string;
    notes: string;
    notesHint: string;
    submit: string;
    saved: string;
    failed: string;
  };
};

const numbered = (text: string, number: number) => text.replace("{number}", String(number));

/**
 * The quote's options, last valid day and note (issue 298): up to five options, each a title, details, baggage and a
 * price in taka. Saving a new quote opens it, ready to send.
 */
function QuoteEditor({ target, options, validUntil, notes, today, labels }: QuoteEditorProps) {
  const id = useId();
  const router = useRouter();
  const next = useRef(options.length + 1);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    (options.length > 0
      ? options
      : [{ id: "o1", title: "", details: null, baggage: null, price: 0 }]
    ).map((option, index) => ({
      key: index + 1,
      title: option.title,
      details: option.details ?? "",
      baggage: option.baggage ?? "",
      price: option.price || undefined,
    })),
  );

  const change = (key: number, patch: Partial<Draft>) =>
    setDrafts((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      options: drafts.map((draft) => ({
        title: draft.title.trim(),
        details: draft.details.trim() || null,
        baggage: draft.baggage.trim() || null,
        price: draft.price ?? 0,
      })),
      validUntil: String(form.get("validUntil") ?? ""),
      notes: String(form.get("notes") ?? "").trim() || null,
    };
    startTransition(async () => {
      const result =
        "leadId" in target
          ? await createQuote(target.leadId, input)
          : await updateQuote(target.quoteId, input);
      if (!result.ok) {
        setErrors(
          Object.fromEntries(
            (result.problem.fields ?? []).map((field) => [field.path, field.message]),
          ),
        );
        toast.error(result.problem.detail ?? labels.failed);
        return;
      }
      setErrors({});
      toast.success(labels.saved);
      if ("leadId" in target) router.push(`/secure-admin-control/quotes/${result.data.id}`);
      else router.refresh();
    });
  }

  const error = (path: string) =>
    errors[path] ? (
      <p id={`${id}-${path}-error`} className="text-sm text-danger-700">
        {errors[path]}
      </p>
    ) : null;
  const described = (path: string, hint?: string) =>
    [hint, errors[path] ? `${id}-${path}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <form
      onSubmit={submit}
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-5 rounded-2xl border border-mist-200 bg-white p-5"
    >
      <div>
        <h2 id={`${id}-title`} className="font-display text-lg font-bold text-navy-900">
          {labels.title}
        </h2>
        <p className="text-[13.5px] text-mist-600">{labels.lead}</p>
      </div>
      {error("options")}
      <ol className="flex flex-col gap-4">
        {drafts.map((draft, index) => {
          const path = `options.${index}`;
          const field = `${id}-${draft.key}`;
          return (
            <li
              key={draft.key}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-mist-200 bg-mist-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-bold tracking-wide text-mist-600 uppercase">
                  {numbered(labels.option, index + 1)}
                </h3>
                {drafts.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={numbered(labels.removeOption, index + 1)}
                    onClick={() =>
                      setDrafts((current) => current.filter((item) => item.key !== draft.key))
                    }
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor={`${field}-title`}>{labels.optionTitle}</Label>
                  <Input
                    id={`${field}-title`}
                    value={draft.title}
                    maxLength={120}
                    required
                    aria-invalid={errors[`${path}.title`] ? true : undefined}
                    aria-describedby={described(`${path}.title`, `${field}-title-hint`)}
                    onChange={(event) => change(draft.key, { title: event.target.value })}
                  />
                  <p id={`${field}-title-hint`} className="text-sm text-mist-600">
                    {labels.optionTitleHint}
                  </p>
                  {error(`${path}.title`)}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor={`${field}-price`}>{labels.price}</Label>
                  <TakaInput
                    id={`${field}-price`}
                    value={draft.price}
                    onChange={(price) => change(draft.key, { price })}
                    invalid={Boolean(errors[`${path}.price`])}
                    describedBy={described(`${path}.price`)}
                    className="h-11 w-full"
                  />
                  {error(`${path}.price`)}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor={`${field}-details`}>{labels.details}</Label>
                  <Textarea
                    id={`${field}-details`}
                    value={draft.details}
                    rows={2}
                    maxLength={600}
                    aria-describedby={`${field}-details-hint`}
                    onChange={(event) => change(draft.key, { details: event.target.value })}
                  />
                  <p id={`${field}-details-hint`} className="text-sm text-mist-600">
                    {labels.detailsHint}
                  </p>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor={`${field}-baggage`}>{labels.baggage}</Label>
                  <Input
                    id={`${field}-baggage`}
                    value={draft.baggage}
                    maxLength={120}
                    aria-describedby={`${field}-baggage-hint`}
                    onChange={(event) => change(draft.key, { baggage: event.target.value })}
                  />
                  <p id={`${field}-baggage-hint`} className="text-sm text-mist-600">
                    {labels.baggageHint}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {drafts.length < QUOTE_MAX_OPTIONS ? (
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const key = next.current;
              next.current += 1;
              setDrafts((current) => [
                ...current,
                { key, title: "", details: "", baggage: "", price: undefined },
              ]);
            }}
          >
            <Plus aria-hidden="true" />
            {labels.addOption}
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 border-t border-mist-100 pt-4 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-validUntil`}>{labels.validUntil}</Label>
          <Input
            id={`${id}-validUntil`}
            name="validUntil"
            type="date"
            min={today}
            required
            defaultValue={validUntil}
            aria-invalid={errors.validUntil ? true : undefined}
            aria-describedby={described("validUntil", `${id}-validUntil-hint`)}
          />
          <p id={`${id}-validUntil-hint`} className="text-sm text-mist-600">
            {labels.validUntilHint}
          </p>
          {error("validUntil")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-notes`}>{labels.notes}</Label>
          <Textarea
            id={`${id}-notes`}
            name="notes"
            rows={3}
            maxLength={1000}
            defaultValue={notes ?? ""}
            aria-describedby={`${id}-notes-hint`}
          />
          <p id={`${id}-notes-hint`} className="text-sm text-mist-600">
            {labels.notesHint}
          </p>
        </div>
      </div>
      <div>
        <Button type="submit" loading={pending}>
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}

export { QuoteEditor };
