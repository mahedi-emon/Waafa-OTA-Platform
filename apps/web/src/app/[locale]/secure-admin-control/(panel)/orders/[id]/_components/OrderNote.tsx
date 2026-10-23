"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { updateOrder } from "@/lib/admin/opsActions";

type OrderNoteProps = {
  id: string;
  strings: { label: string; placeholder: string; submit: string; added: string; failed: string };
};

/** A note on the order's history, for the team; it changes nothing else. */
function OrderNote({ id, strings }: OrderNoteProps) {
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const text = note.trim();
        if (!text) return;
        startTransition(async () => {
          const result = await updateOrder(id, { note: text });
          if (!result.ok) {
            toast.error(result.problem.detail ?? strings.failed);
            return;
          }
          toast.success(strings.added);
          setNote("");
          router.refresh();
        });
      }}
    >
      <Label htmlFor={`${uid}-note`}>{strings.label}</Label>
      <Textarea
        id={`${uid}-note`}
        value={note}
        rows={2}
        maxLength={300}
        placeholder={strings.placeholder}
        onChange={(event) => setNote(event.target.value)}
      />
      <div>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={!note.trim()}
        >
          {strings.submit}
        </Button>
      </div>
    </form>
  );
}

export { OrderNote };
