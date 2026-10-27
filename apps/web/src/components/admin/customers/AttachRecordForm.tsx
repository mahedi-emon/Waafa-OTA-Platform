"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useRouter } from "@/i18n/navigation";
import { attachToAccount } from "@/lib/admin/customerAccountActions";

type AttachRecordFormProps = {
  accountId: string;
  /** Orders only for roles that see them. */
  kinds: Array<{ value: "lead" | "order"; label: string }>;
  labels: {
    kind: string;
    reference: string;
    hint: string;
    submit: string;
    done: string;
    failed: string;
  };
};

/** Staff put a request or an order on an account by its reference (issue 241); the API checks access and audits it. */
function AttachRecordForm({ accountId, kinds, labels }: AttachRecordFormProps) {
  const id = useId();
  const router = useRouter();
  const [kind, setKind] = useState<"lead" | "order">(kinds[0]?.value ?? "lead");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reference.trim().length < 3) return;
    startTransition(async () => {
      const result = await attachToAccount(accountId, { kind, reference });
      if (!result.ok) {
        toast.error(result.problem.detail ?? labels.failed);
        return;
      }
      toast.success(labels.done);
      setReference("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-40">
        <label htmlFor={`${id}-kind`} className="text-[14px] font-semibold text-navy-900">
          {labels.kind}
        </label>
        <NativeSelect
          id={`${id}-kind`}
          value={kind}
          onChange={(event) => setKind(event.target.value as "lead" | "order")}
        >
          {kinds.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor={`${id}-reference`} className="text-[14px] font-semibold text-navy-900">
          {labels.reference}
        </label>
        <Input
          id={`${id}-reference`}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder={labels.hint}
          autoComplete="off"
          required
          minLength={3}
          maxLength={40}
        />
      </div>
      <Button type="submit" variant="secondary" loading={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}

export { AttachRecordForm };
