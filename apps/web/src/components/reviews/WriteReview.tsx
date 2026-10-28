"use client";

import { useEffect, useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export type WriteReviewStrings = {
  write: string;
  signIn: string;
  notEligible: string;
  reviewed: string;
  rating: string;
  ratingOption: string;
  title: string;
  body: string;
  bodyHint: string;
  submit: string;
  thanks: string;
  failed: string;
};

type State = "loading" | "signedOut" | "notEligible" | "reviewed" | "open" | "sent";

type WriteReviewProps = {
  kind: "package" | "product";
  targetId: string;
  /** Where sign-in brings the customer back to. */
  path: string;
  strings: WriteReviewStrings;
};

/**
 * "Write a review" (issue 245): after hydration it asks whether this signed-in customer booked or received the item;
 * only then the form shows. The page itself stays static. Everything typed is sent as text and shown as text.
 */
function WriteReview({ kind, targetId, path, strings }: WriteReviewProps) {
  const id = useId();
  const [state, setState] = useState<State>("loading");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    fetch(`/api/reviews?kind=${kind}&targetId=${encodeURIComponent(targetId)}`, {
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((answer: { signedIn?: boolean; eligible?: boolean; reviewed?: boolean } | null) => {
        if (!live) return;
        if (!answer?.signedIn) setState("signedOut");
        else if (answer.reviewed) setState("reviewed");
        else setState(answer.eligible ? "open" : "notEligible");
      })
      .catch(() => live && setState("signedOut"));
    return () => {
      live = false;
    };
  }, [kind, targetId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (rating < 1 || body.trim().length < 10) return;
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          targetId,
          rating,
          ...(title.trim() ? { title: title.trim() } : {}),
          body: body.trim(),
        }),
      }).catch(() => null);
      const answer = (await response?.json().catch(() => null)) as { ok?: boolean } | null;
      if (answer?.ok) setState("sent");
      else setError(strings.failed);
    });
  }

  if (state === "loading") return null;
  if (state === "signedOut")
    return (
      <p className="text-[14px] text-mist-700">
        <a
          href={`/login?next=${encodeURIComponent(path)}`}
          className="font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          {strings.signIn}
        </a>
      </p>
    );
  if (state === "notEligible")
    return <p className="text-[14px] text-mist-700">{strings.notEligible}</p>;
  if (state === "reviewed" || state === "sent")
    return (
      <p role="status" className="text-[14px] font-medium text-success-700">
        {state === "sent" ? strings.thanks : strings.reviewed}
      </p>
    );

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl bg-mist-25 p-4 ring-1 ring-mist-100"
    >
      <h3 className="font-display text-[17px] font-bold text-navy-900">{strings.write}</h3>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[14px] font-semibold text-navy-900">{strings.rating}</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="has-focus-visible:ring-brand-600 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-3 text-[14px] ring-1 ring-mist-200 has-checked:bg-navy-900 has-checked:text-white has-checked:ring-navy-900 has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name={`${id}-rating`}
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              {strings.ratingOption.replace("{value}", String(value))}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-title`} className="text-[14px] font-semibold text-navy-900">
          {strings.title}
        </label>
        <input
          id={`${id}-title`}
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          className="min-h-11 rounded-xl border border-mist-200 bg-white px-3 text-[16px]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-body`} className="text-[14px] font-semibold text-navy-900">
          {strings.body}
        </label>
        <textarea
          id={`${id}-body`}
          value={body}
          maxLength={2000}
          rows={4}
          aria-describedby={`${id}-hint`}
          onChange={(event) => setBody(event.target.value)}
          className="rounded-xl border border-mist-200 bg-white p-3 text-[16px]"
        />
        <p id={`${id}-hint`} className="text-[12.5px] text-mist-600">
          {strings.bodyHint}
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-[14px] text-danger-700">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={pending} disabled={rating < 1 || body.trim().length < 10}>
          {strings.submit}
        </Button>
      </div>
    </form>
  );
}

export { WriteReview };
