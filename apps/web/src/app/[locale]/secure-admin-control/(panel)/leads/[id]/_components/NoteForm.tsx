"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { addLeadNote } from "@/lib/admin/leadActions";

type NoteType = "note" | "call" | "email" | "whatsapp";

type NoteFormProps = {
  id: string;
  types: Array<{ value: NoteType; label: string }>;
  strings: { type: string; placeholder: string; submit: string; added: string; failed: string };
};

/** Adds a note, call, email or WhatsApp entry to the lead's timeline (a call or message counts as a first response). */
function NoteForm({ id, types, strings }: NoteFormProps) {
  const router = useRouter();
  const [type, setType] = useState<NoteType>("note");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

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
      <Textarea
        id="lead-note"
        value={body}
        maxLength={2000}
        onChange={(event) => setBody(event.target.value)}
        placeholder={strings.placeholder}
        className="min-h-24"
      />
      <div>
        <Button size="sm" onClick={submit} loading={pending} disabled={!body.trim()}>
          {strings.submit}
        </Button>
      </div>
    </div>
  );
}

export { NoteForm };
