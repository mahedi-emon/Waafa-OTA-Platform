"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/admin/StatusChip";
import { Link, useRouter } from "@/i18n/navigation";
import { deleteRecord, reorderRecords, restoreTrashItem } from "@/lib/admin/contentActions";
import { formatDhakaDateTime } from "@/lib/admin/format";
import type { RecordChipName } from "@/lib/admin/recordChips";
import { RECORD_CHIPS } from "@/lib/admin/statusChips";

type RecordListProps = {
  contentKey: string;
  items: Array<{
    id: string;
    title: string;
    updatedAt: string;
    updatedBy: string | null;
    sample: boolean;
    /** Status chips with their words, worked out on the server (D0 R4). */
    chips: Array<{ name: RecordChipName; label: string; reason: string }>;
  }>;
  strings: {
    search: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    deleted: string;
    moveUp: string;
    moveDown: string;
    orderSaved: string;
    failed: string;
    sample: string;
    empty: string;
    updated: string;
    undo: string;
    restored: string;
  };
};

/** The records of one content list: search, open, move up or down (admin order), delete. */
function RecordList({ contentKey, items, strings }: RecordListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(items.map((item) => item.id));
  const [pending, startTransition] = useTransition();
  const byId = new Map(items.map((item) => [item.id, item]));
  const needle = query.trim().toLowerCase();
  const visible = order
    .map((id) => byId.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter(
      (item) =>
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.id.toLowerCase().includes(needle),
    );

  function move(id: string, by: -1 | 1) {
    const index = order.indexOf(id);
    const target = index + by;
    if (index < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target] as string, next[index] as string];
    setOrder(next);
    startTransition(async () => {
      const result = await reorderRecords(contentKey, next);
      if (!result.ok) {
        setOrder(order);
        toast.error(strings.failed);
        return;
      }
      toast.success(strings.orderSaved);
    });
  }

  function remove(id: string, title: string) {
    if (!window.confirm(strings.deleteConfirm.replace("{title}", title))) return;
    startTransition(async () => {
      const result = await deleteRecord(contentKey, id);
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      setOrder((list) => list.filter((item) => item !== id));
      const trashId = result.trashId;
      // Delete moves the record to Trash (D0 R4): Undo brings it straight back.
      toast.success(strings.deleted, {
        ...(trashId
          ? {
              action: {
                label: strings.undo,
                onClick: () => {
                  void restoreTrashItem(trashId).then((back) => {
                    if (!back.ok) {
                      toast.error(back.problem.detail ?? strings.failed);
                      return;
                    }
                    setOrder((list) => (list.includes(id) ? list : [...list, id]));
                    toast.success(strings.restored);
                    router.refresh();
                  });
                },
              },
            }
          : {}),
      });
      router.refresh();
    });
  }

  return (
    <div>
      <div className="border-b border-mist-100 p-4">
        <label htmlFor="record-search" className="sr-only">
          {strings.search}
        </label>
        <div className="relative max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
          />
          <Input
            id="record-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={strings.search}
            className="pl-10"
          />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="px-5 py-10 text-center text-[14px] text-mist-600">{strings.empty}</p>
      ) : (
        <ul className="divide-y divide-mist-100">
          {visible.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/secure-admin-control/content/${contentKey}/${encodeURIComponent(item.id)}`}
                  prefetch={false}
                  className="block truncate font-semibold text-navy-900 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="truncate text-[12.5px] text-mist-600">
                  {strings.updated.replace("{time}", formatDhakaDateTime(item.updatedAt))}
                  {item.updatedBy ? ` · ${item.updatedBy}` : ""}
                </p>
              </div>
              {item.chips.length > 0 ? (
                <div className="hidden shrink-0 flex-wrap justify-end gap-1.5 md:flex">
                  {item.chips.map((chip) => (
                    <StatusChip
                      key={chip.name}
                      size="sm"
                      tone={RECORD_CHIPS[chip.name].tone}
                      icon={RECORD_CHIPS[chip.name].icon}
                      label={chip.label}
                      reason={chip.reason}
                    />
                  ))}
                </div>
              ) : null}
              {item.sample ? <Badge variant="outline">{strings.sample}</Badge> : null}
              {!needle ? (
                <div className="hidden shrink-0 gap-1 sm:flex">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={strings.moveUp}
                    disabled={pending}
                    onClick={() => move(item.id, -1)}
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={strings.moveDown}
                    disabled={pending}
                    onClick={() => move(item.id, 1)}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ) : null}
              <Button
                asChild
                variant="secondary"
                size="icon-sm"
                aria-label={`${strings.edit} ${item.title}`}
              >
                <Link
                  href={`/secure-admin-control/content/${contentKey}/${encodeURIComponent(item.id)}`}
                  prefetch={false}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${strings.delete} ${item.title}`}
                disabled={pending}
                onClick={() => remove(item.id, item.title)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { RecordList };
