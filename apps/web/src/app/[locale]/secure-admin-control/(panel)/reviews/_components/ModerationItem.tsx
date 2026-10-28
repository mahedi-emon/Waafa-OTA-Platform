"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { answerQuestion, decideReview } from "@/lib/admin/reviewActions";

type ModerationItemProps = {
  kind: "review" | "question";
  id: string;
  strings: {
    reply: string;
    answer: string;
    approve: string;
    reject: string;
    publish: string;
    hide: string;
    done: string;
    failed: string;
  };
};

/** The buttons under one review or question (issue 245): approve or reject with a reply, or answer and publish. */
function ModerationItem({ kind, id, strings }: ModerationItemProps) {
  const router = useRouter();
  const field = useId();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(strings.failed);
        return;
      }
      toast.success(strings.done);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field}>{kind === "review" ? strings.reply : strings.answer}</Label>
      <Textarea
        id={field}
        value={text}
        maxLength={1000}
        onChange={(event) => setText(event.target.value)}
        className="min-h-16"
      />
      <div className="flex flex-wrap gap-2">
        {kind === "review" ? (
          <>
            <Button
              size="sm"
              loading={pending}
              onClick={() =>
                run(() =>
                  decideReview(id, {
                    status: "approved",
                    ...(text.trim() ? { reply: text.trim() } : {}),
                  }),
                )
              }
            >
              {strings.approve}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={pending}
              onClick={() => run(() => decideReview(id, { status: "rejected" }))}
            >
              {strings.reject}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              loading={pending}
              disabled={text.trim().length < 2}
              onClick={() =>
                run(() => answerQuestion(id, { status: "published", answer: text.trim() }))
              }
            >
              {strings.publish}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={pending}
              onClick={() => run(() => answerQuestion(id, { status: "hidden" }))}
            >
              {strings.hide}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export { ModerationItem };
