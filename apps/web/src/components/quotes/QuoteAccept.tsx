"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { useTurnstile } from "@/components/forms/useTurnstile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "@/i18n/navigation";

export type QuoteAcceptOption = {
  id: string;
  label: string;
  title: string;
  details: string | null;
  baggage: string | null;
  price: string;
};

type QuoteAcceptProps = {
  token: string;
  options: QuoteAcceptOption[];
  /** Open: pick and accept; otherwise the options are shown as they stand. */
  open: boolean;
  acceptedOptionId: string | null;
  labels: {
    options: string;
    pick: string;
    accept: string;
    accepting: string;
    vat: string;
    selected: string;
    failed: string;
    challenge: string;
    conflict: string;
    expired: string;
  };
};

/**
 * The customer's options on a quote (issue 298): one card each with what it includes and the price; while the quote
 * is open the customer picks one and accepts it (Turnstile when it is on). The page then shows the accepted state.
 */
function QuoteAccept({ token, options, open, acceptedOptionId, labels }: QuoteAcceptProps) {
  const id = useId();
  const router = useRouter();
  const turnstile = useTurnstile();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<string | undefined>(
    open && options.length === 1 ? options[0]?.id : undefined,
  );
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) {
      setError(labels.pick);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const turnstileToken = await turnstile.getToken();
        const response = await fetch("/api/quotes/accept", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, optionId: choice, turnstileToken }),
        });
        turnstile.reset();
        if (response.ok) {
          router.refresh();
          return;
        }
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(
          body.error === "challenge"
            ? labels.challenge
            : body.error === "expired"
              ? labels.expired
              : body.error === "conflict"
                ? labels.conflict
                : labels.failed,
        );
      } catch {
        setError(labels.failed);
      }
    });
  }

  const cards = options.map((option) => {
    const accepted = option.id === acceptedOptionId;
    const body = (
      <>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold tracking-wide text-mist-600 uppercase">
            {option.label}
            {accepted ? (
              <Badge variant="success">
                <CircleCheck aria-hidden="true" />
                {labels.selected}
              </Badge>
            ) : null}
          </span>
          <span className="font-display text-[17px] font-bold text-navy-900">{option.title}</span>
          {option.details ? (
            <span className="text-[15px] text-mist-700">{option.details}</span>
          ) : null}
          {option.baggage ? (
            <span className="text-[15px] text-mist-700">{option.baggage}</span>
          ) : null}
        </div>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="font-display text-xl font-bold text-navy-900 tabular-nums">
            {option.price}
          </span>
          <span className="text-[12.5px] text-mist-600">{labels.vat}</span>
        </span>
      </>
    );
    return open ? (
      <label
        key={option.id}
        htmlFor={`${id}-${option.id}`}
        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-mist-200 bg-white p-4 transition-colors has-checked:border-electric-600 has-checked:bg-electric-50 sm:p-5"
      >
        <RadioGroupItem id={`${id}-${option.id}`} value={option.id} className="mt-1" />
        {body}
      </label>
    ) : (
      <div
        key={option.id}
        className={
          accepted
            ? "flex items-start gap-3 rounded-2xl border border-success-600/40 bg-success-50 p-4 sm:p-5"
            : "flex items-start gap-3 rounded-2xl border border-mist-200 bg-white p-4 sm:p-5"
        }
      >
        {body}
      </div>
    );
  });

  if (!open) {
    return (
      <section aria-labelledby={`${id}-options`} className="flex flex-col gap-3">
        <h2 id={`${id}-options`} className="sr-only">
          {labels.options}
        </h2>
        {cards}
      </section>
    );
  }

  return (
    <form
      onSubmit={submit}
      onFocusCapture={turnstile.activate}
      aria-labelledby={`${id}-options`}
      className="flex flex-col gap-4"
    >
      <h2 id={`${id}-options`} className="font-display text-lg font-bold text-navy-900">
        {labels.options}
      </h2>
      <p id={`${id}-pick`} className="text-[15px] text-mist-700">
        {labels.pick}
      </p>
      <RadioGroup
        value={choice}
        onValueChange={setChoice}
        aria-labelledby={`${id}-options`}
        aria-describedby={`${id}-pick`}
        className="gap-3"
      >
        {cards}
      </RadioGroup>
      {turnstile.field}
      {error ? (
        <p role="alert" className="text-[14px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
          {pending ? labels.accepting : labels.accept}
        </Button>
      </div>
    </form>
  );
}

export { QuoteAccept };
