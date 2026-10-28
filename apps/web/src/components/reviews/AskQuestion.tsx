"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useTurnstile } from "@/components/forms/useTurnstile";
import { Button } from "@/components/ui/button";

export type AskQuestionStrings = {
  ask: string;
  name: string;
  question: string;
  submit: string;
  thanks: string;
  failed: string;
};

/** Ask about a product (issue 245): Turnstile when it is on; the question shows once staff answer it. */
function AskQuestion({ productId, strings }: { productId: string; strings: AskQuestionStrings }) {
  const id = useId();
  const turnstile = useTurnstile();
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<"open" | "sent" | "failed">("open");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || question.trim().length < 5) return;
    startTransition(async () => {
      const turnstileToken = await turnstile.getToken();
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          name: name.trim(),
          question: question.trim(),
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      }).catch(() => null);
      turnstile.reset();
      setState(response?.ok ? "sent" : "failed");
    });
  }

  if (state === "sent")
    return (
      <p role="status" className="text-[14px] font-medium text-success-700">
        {strings.thanks}
      </p>
    );

  return (
    <form
      onSubmit={submit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-3 rounded-2xl bg-mist-25 p-4 ring-1 ring-mist-100"
    >
      <h3 className="font-display text-[17px] font-bold text-navy-900">{strings.ask}</h3>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-name`} className="text-[14px] font-semibold text-navy-900">
          {strings.name}
        </label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={60}
          autoComplete="given-name"
          onChange={(event) => setName(event.target.value)}
          className="min-h-11 rounded-xl border border-mist-200 bg-white px-3 text-[16px]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-question`} className="text-[14px] font-semibold text-navy-900">
          {strings.question}
        </label>
        <textarea
          id={`${id}-question`}
          value={question}
          maxLength={500}
          rows={3}
          onChange={(event) => setQuestion(event.target.value)}
          className="rounded-xl border border-mist-200 bg-white p-3 text-[16px]"
        />
      </div>
      {turnstile.field}
      {state === "failed" ? (
        <p role="alert" className="text-[14px] text-danger-700">
          {strings.failed}
        </p>
      ) : null}
      <div>
        <Button
          type="submit"
          loading={pending}
          disabled={name.trim().length < 2 || question.trim().length < 5}
        >
          {strings.submit}
        </Button>
      </div>
    </form>
  );
}

export { AskQuestion };
