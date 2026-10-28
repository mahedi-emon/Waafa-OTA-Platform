"use client";

import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { addLeadNote } from "@/lib/admin/leadActions";
import { mentionQuery } from "@/lib/admin/mentionQuery";

type NoteType = "note" | "call" | "email" | "whatsapp";
type Person = { id: string; name: string };

type NoteFormProps = {
  id: string;
  types: Array<{ value: NoteType; label: string }>;
  /** Colleagues who can open this lead, for "@" mentions (issue 243). */
  people: Person[];
  strings: {
    type: string;
    placeholder: string;
    submit: string;
    added: string;
    failed: string;
    mentionHint: string;
    mentionList: string;
  };
};

/**
 * Adds a note, call, email or WhatsApp entry to the lead's timeline (a call or message counts as a first response).
 * Typing "@" offers the colleagues who can open this lead; picking one writes "@Full Name", and the API alerts them.
 */
function NoteForm({ id, types, people, strings }: NoteFormProps) {
  const router = useRouter();
  const listId = useId();
  const hintId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [type, setType] = useState<NoteType>("note");
  const [body, setBody] = useState("");
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const mention = mentionQuery(body, caret);
  const matches =
    mention && dismissed !== mention.start
      ? people
          .filter(
            (person) =>
              person.name.toLowerCase().startsWith(mention.query.toLowerCase().trimStart()) ||
              person.name.toLowerCase().includes(` ${mention.query.toLowerCase().trim()}`),
          )
          .slice(0, 6)
      : [];
  const open = matches.length > 0;
  const current = Math.min(active, Math.max(matches.length - 1, 0));

  function pick(person: Person) {
    if (!mention) return;
    const insert = `@${person.name} `;
    const next = body.slice(0, mention.start) + insert + body.slice(caret);
    const position = mention.start + insert.length;
    setBody(next);
    setCaret(position);
    setActive(0);
    requestAnimationFrame(() => {
      field.current?.focus();
      field.current?.setSelectionRange(position, position);
    });
  }

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addLeadNote(id, { type, body: body.trim() });
      if (!result.ok) {
        toast.error(strings.failed);
        return;
      }
      toast.success(strings.added);
      setBody("");
      setCaret(0);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={strings.type}>
        {types.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={type === option.value}
            onClick={() => setType(option.value)}
            className={
              type === option.value
                ? "min-h-11 cursor-pointer rounded-full bg-navy-900 px-4 text-[14px] font-semibold text-white"
                : "min-h-11 cursor-pointer rounded-full bg-white px-4 text-[14px] font-semibold text-navy-900 ring-1 ring-mist-200 hover:bg-mist-50"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      <Label htmlFor="lead-note" className="sr-only">
        {strings.placeholder}
      </Label>
      <div className="relative">
        <Textarea
          ref={field}
          id="lead-note"
          value={body}
          maxLength={2000}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-describedby={hintId}
          {...(open ? { "aria-activedescendant": `${listId}-${current}` } : {})}
          onChange={(event) => {
            setBody(event.target.value);
            setCaret(event.target.selectionStart);
            setDismissed(null);
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={(event) => {
            if (!open) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              setActive((current + step + matches.length) % matches.length);
            } else if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              const person = matches[current];
              if (person) pick(person);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setDismissed(mention?.start ?? null);
            }
          }}
          placeholder={strings.placeholder}
          className="min-h-24"
        />
        <ul
          id={listId}
          role="listbox"
          aria-label={strings.mentionList}
          hidden={!open}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-mist-200"
        >
          {matches.map((person, index) => (
            <li
              key={person.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === current}
              onPointerDown={(event) => {
                event.preventDefault();
                pick(person);
              }}
              className={cn(
                "flex min-h-11 cursor-pointer items-center px-3 text-[14.5px] text-ink-900",
                index === current ? "bg-electric-50 text-brand-700" : "hover:bg-mist-25",
              )}
            >
              @{person.name}
            </li>
          ))}
        </ul>
      </div>
      <p id={hintId} className="text-[12.5px] text-mist-600">
        {strings.mentionHint}
      </p>
      <div>
        <Button size="sm" onClick={submit} loading={pending} disabled={!body.trim()}>
          {strings.submit}
        </Button>
      </div>
    </div>
  );
}

export { NoteForm };
