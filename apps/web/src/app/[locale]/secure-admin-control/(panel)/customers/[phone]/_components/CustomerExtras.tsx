"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import {
  addCustomerNote,
  mergeCustomer,
  saveCustomerTags,
  unmergeCustomer,
} from "@/lib/admin/customerActions";
import { formatDhakaDateTime } from "@/lib/admin/format";

/** "01712-345678", "8801712345678" or "+880 1712 345678" → "+8801712345678"; null when it is not a BD mobile. */
function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("880")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return /^1[3-9]\d{8}$/.test(local) ? `+880${local}` : null;
}

type Note = { id: string; body: string; actor: string; createdAt: string };

export type CustomerExtrasStrings = {
  tags: string;
  tagsHint: string;
  addTag: string;
  removeTag: string;
  saveTags: string;
  notes: string;
  notePlaceholder: string;
  addNote: string;
  noNotes: string;
  merge: string;
  mergeHint: string;
  mergePhone: string;
  mergeSubmit: string;
  merged: string;
  unmerge: string;
  saved: string;
  failed: string;
  badPhone: string;
};

type CustomerExtrasProps = {
  phone: string;
  tags: string[];
  notes: Note[];
  mergedPhones: string[];
  /** Admin and Super Admin merge and unmerge (the API checks again). */
  canMerge: boolean;
  strings: CustomerExtrasStrings;
};

/** Tags, notes and merges on a customer (issue 244). Notes are plain text; React escapes anything typed. */
function CustomerExtras({
  phone,
  tags,
  notes,
  mergedPhones,
  canMerge,
  strings,
}: CustomerExtrasProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draftTags, setDraftTags] = useState(tags);
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [other, setOther] = useState("");

  const run = (work: () => Promise<{ ok: boolean }>, done: () => void = () => undefined) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(strings.failed);
        return;
      }
      toast.success(strings.saved);
      done();
      router.refresh();
    });

  const addTag = () => {
    const value = tag.trim();
    if (!value || draftTags.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setDraftTags([...draftTags, value].slice(0, 12));
    setTag("");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section
        aria-labelledby="customer-tags"
        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="customer-tags" className="font-display text-lg font-bold text-navy-900">
          {strings.tags}
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label={strings.tags}>
          {draftTags.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 py-1 pr-1 pl-3 text-[13.5px] font-semibold text-sky-700"
            >
              {item}
              <button
                type="button"
                onClick={() => setDraftTags(draftTags.filter((value) => value !== item))}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-white"
              >
                <X aria-hidden="true" className="size-3.5" />
                <span className="sr-only">
                  {strings.removeTag} {item}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-tag">{strings.addTag}</Label>
          <div className="flex gap-2">
            <Input
              id="customer-tag"
              value={tag}
              maxLength={30}
              onChange={(event) => setTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11"
              onClick={addTag}
            >
              {strings.addTag}
            </Button>
          </div>
          <p className="text-[12.5px] text-mist-600">{strings.tagsHint}</p>
        </div>
        <div>
          <Button
            size="sm"
            loading={pending}
            onClick={() => run(() => saveCustomerTags(phone, draftTags))}
          >
            {strings.saveTags}
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="customer-notes"
        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="customer-notes" className="font-display text-lg font-bold text-navy-900">
          {strings.notes}
        </h2>
        <Label htmlFor="customer-note" className="sr-only">
          {strings.notePlaceholder}
        </Label>
        <Textarea
          id="customer-note"
          value={note}
          maxLength={2000}
          placeholder={strings.notePlaceholder}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-20"
        />
        <div>
          <Button
            size="sm"
            loading={pending}
            disabled={!note.trim()}
            onClick={() =>
              run(
                () => addCustomerNote(phone, note),
                () => setNote(""),
              )
            }
          >
            {strings.addNote}
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="text-[14px] text-mist-600">{strings.noNotes}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mist-100">
            {notes.map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5 py-2.5">
                <p className="text-[14.5px] break-words whitespace-pre-line text-ink-900">
                  {item.body}
                </p>
                <p className="text-[12.5px] text-mist-600">
                  {item.actor} · {formatDhakaDateTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canMerge ? (
        <section
          aria-labelledby="customer-merge"
          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5 lg:col-span-2"
        >
          <h2 id="customer-merge" className="font-display text-lg font-bold text-navy-900">
            {strings.merge}
          </h2>
          <p className="text-[13.5px] text-mist-600">{strings.mergeHint}</p>
          {mergedPhones.length > 0 ? (
            <ul className="flex flex-col gap-2" aria-label={strings.merged}>
              {mergedPhones.map((item) => (
                <li
                  key={item}
                  className="flex flex-wrap items-center justify-between gap-2 text-[14.5px]"
                >
                  <span className="tabular-nums">{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => run(() => unmergeCustomer(item))}
                  >
                    {strings.unmerge} {item}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const number = toE164(other);
              if (!number) {
                toast.error(strings.badPhone);
                return;
              }
              run(
                () => mergeCustomer(number, phone),
                () => setOther(""),
              );
            }}
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="customer-merge-phone">{strings.mergePhone}</Label>
              <Input
                id="customer-merge-phone"
                inputMode="tel"
                value={other}
                onChange={(event) => setOther(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="min-h-11"
              loading={pending}
            >
              {strings.mergeSubmit}
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

export { CustomerExtras };
